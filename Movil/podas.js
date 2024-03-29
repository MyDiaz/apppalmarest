const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);
const { StringDecoder } = require('node:string_decoder');

var post_podas = async (req) => {
    var diarias;
    const cliente_bd = await BaseDatos.connect();
    let podasIds = [];

    for (i in req.body.data) {
        var auxpoda = req.body.data[i]["poda"];
        var diarias = req.body.data[i]["diarias"];

        const decoder = new StringDecoder('utf8');
        var podavalues = [];
        const { id_poda, nombre_lote, estado_poda } = auxpoda;
        const cent = Buffer.from(nombre_lote);
        podavalues.push(decoder.write(cent), estado_poda);

        // Obtenemos el poda de la base de datos central si existe
        //Si no existe la crea
        if (!id_poda) {
            try {
                await cliente_bd.query('BEGIN');
                const podaQuery = format(`INSERT INTO public."PODAS"(nombre_lote, estado_poda) VALUES (%L) RETURNING id_poda;`, podavalues);

                // Se agrega el poda
                const podaResult = await cliente_bd.query(podaQuery);
                const podaId = podaResult.rows[0].id_poda;
                podasIds.push(podaId);

                // Se agregan los podas diarias con el id devuelto por la base de datos central, 
                // diferentes a los de los celulares. Asi evitamos conflictos.
                var podadiariavalues = [];
                        if (diarias.length > 0) {
                        for (j in diarias) {
                            var auxpodadiaria = diarias[j];
                        const { fecha_poda_diaria, cantidad_poda_diaria, cc_usuario, linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin } = auxpodadiaria;
                        podadiariavalues.push([podaId, fecha_poda_diaria, cantidad_poda_diaria, cc_usuario, linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin]);

                    }
                    let sqlPodaDiaria = format(`INSERT INTO public."PODA_DIARIA"(id_poda, fecha_poda_diaria, cantidad_poda_diaria, cc_usuario, linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin ) VALUES %L`, podadiariavalues);
                    await cliente_bd.query(sqlPodaDiaria);
                }

                await cliente_bd.query('COMMIT');
            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
                return { "success": false, "podasIds": [] };
            }
        } else {
            try {
                podasIds.push(-1);
                await cliente_bd.query('BEGIN');

                let podaQuery = `UPDATE public."PODAS" SET ` + (estado_poda !== null ? `estado_poda = '${estado_poda}'` : "") + ` WHERE id_poda = ${id_poda}`;
                if (estado_poda) {
                    await cliente_bd.query(podaQuery);
                }

                var podadiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxpodadiaria = diarias[j];
                        const { fecha_poda_diaria, cantidad_poda_diaria, cc_usuario, linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin } = auxpodadiaria;
                        podadiariavalues.push([id_poda, fecha_poda_diaria, cantidad_poda_diaria, cc_usuario, linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin]);
                    }
                    let sqlPodaDiaria = format(`INSERT INTO public."PODA_DIARIA"(id_poda, fecha_poda_diaria, cantidad_poda_diaria, cc_usuario, linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin) VALUES %L`, podadiariavalues);
                    await cliente_bd.query(sqlPodaDiaria);
                }
                await cliente_bd.query('COMMIT');

            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
                return { "success": false, "podasIds": [] };
            }
        }

    }
    cliente_bd.release();
    return { "success": true, "podasIds": podasIds };
}






rutas.route('/movil/podas')
    .post(authorize(["admin"]), (req, res) => {
        post_podas(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los podas' });
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