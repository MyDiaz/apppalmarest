const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const { StringDecoder } = require('node:string_decoder');

const BaseDatos = new Pool(config.connectionData);

var post_censos = async (req) => {
    const cliente_bd = await BaseDatos.connect();
    let registrosIds = [];
    for (i in req.body.data) {
        var values = [];
        let censo = req.body.data[i]["censo"];
        let etapas = req.body.data[i]["etapas"];
        let imagenes = req.body.data[i]["imagenes"];

        const { fecha_censo, hora_censo, observacion_censo, nombre_lote, estado_censo, cc_usuario, nombre_comun_plaga, numero_individuos, id_palma, longitud, latitud } = censo;
        const horaTime = new Date(hora_censo).toLocaleTimeString('es',
            { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
        const fechaTime = new Date(fecha_censo);
        const decoder = new StringDecoder('utf8');

        const centnombreLote = Buffer.from(nombre_lote);
        const centnombrePlaga = Buffer.from(nombre_comun_plaga);

        values.push(fechaTime, horaTime, observacion_censo, decoder.write(centnombreLote), estado_censo, cc_usuario, decoder.write(centnombrePlaga),numero_individuos, id_palma, longitud, latitud);
        try {
            await cliente_bd.query('BEGIN');
            const registroQuery = format(`INSERT INTO public."CENSO"(fecha_censo, hora_censo, observacion_censo, nombre_lote, estado_censo, cc_usuario, nombre_comun_plaga, numero_individuos,id_palma, longitud, latitud) VALUES (%L) RETURNING id_censo;`, values);

            // Se agrega el registro
            const registroResult = await cliente_bd.query(registroQuery);
            const registroId = registroResult.rows[0].id_censo;
            registrosIds.push(registroId);

            // Se agregan las etapas con el id devuelto por la base de datos central, 
            // diferentes a los de los celulares. Asi evitamos conflictos.
            var etapasvalues = [];
            if (etapas.length > 0) {
                for (j in etapas) {
                    var auxetapa = etapas[j];
                    const { id_etapa_plaga, numero_individuos } = auxetapa;
                  
                    etapasvalues.push([registroId, id_etapa_plaga, numero_individuos]);
                }
                let sqletapas = format(`INSERT INTO public."CENSO_ETAPAPLAGA"(id_censo, id_etapa_plaga, numero_individuos) VALUES %L`, etapasvalues);
                await cliente_bd.query(sqletapas);
            }
            // Se agregan las imagenes de igual forma 
            var imagenesvalues = [];
            if (imagenes.length > 0) {
                for (j in imagenes) {
                    var auximagen = imagenes[j];
                    const { imagen } = auximagen;
                    // Convert base64 string to Buffer
                    const buffer = Buffer.from(imagen, 'base64');
                    // Convert Buffer to Uint8Array
                    imagenesvalues.push([registroId, buffer]);
                }
                let sqlImagenes = format(`INSERT INTO public."IMAGEN_CENSO"(id_censo, imagen) VALUES %L`, imagenesvalues);
                await cliente_bd.query(sqlImagenes);
            }

            await cliente_bd.query('COMMIT');

        } catch (e) {
            console.log(e);
            await cliente_bd.query('ROLLBACK');
            return { "success": false};
        }

    }
    cliente_bd.release();
    return { "success": true, "registrosIds": registrosIds };
}

rutas.route('/movil/censosplagas')
    .post(authorize(["admin"]), (req, res) => {
        post_censos(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los censos de plagas' });
            } else {
                res.status(200).send(rta);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
        // }
    })




module.exports = rutas;