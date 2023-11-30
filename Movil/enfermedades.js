const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const { StringDecoder } = require('node:string_decoder');

const BaseDatos = new Pool(config.connectionData);


var get_enfermedadesTodas = async () => {
    let consulta = `SELECT * FROM "ENFERMEDAD" where fue_borrado = false;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_registros_enfermedad_ids = async (req) => {
    const cliente_bd = await BaseDatos.connect();
    var results = [];
    for (i in req.body.data) {
        var values = [];
        let body = req.body.data[i];
        const { fecha_registro_enfermedad, hora_registro_enfermedad, id_palma } = body;

        const horaTime = new Date(hora_registro_enfermedad).toLocaleTimeString('es',
            { timeStyle: 'short', hour12: false, timeZone: 'UTC' });

        values.push(fecha_registro_enfermedad.split("T")[0], horaTime, id_palma);

        let sql = format(`SELECT *FROM public."REGISTRO_ENFERMEDAD"
        WHERE fecha_registro_enfermedad = %L AND hora_registro_enfermedad = %L AND id_palma = %L`, ...values);


        let rta = await cliente_bd.query(sql);
        results.push(rta.rows[0].id_registro_enfermedad); // 
    }
    cliente_bd.release();
    return { "results": results };
}


var post_enfermedades = async (req) => {
    const cliente_bd = await BaseDatos.connect();
    let registrosIds = [];
    for (i in req.body.data) {
        var values = [];
        let registro = req.body.data[i]["registro_enfermedad"];
        let imagenes = req.body.data[i]["imagenes"];

        const { id_registro_enfermedad ,hora_registro_enfermedad, observacion_registro_enfermedad, fecha_registro_enfermedad, id_palma, nombre_enfermedad, id_etapa_enfermedad, cc_usuario,dada_de_alta } = registro;
        const horaTime = new Date(hora_registro_enfermedad).toLocaleTimeString('es',
            { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
        const fechaTime = new Date(fecha_registro_enfermedad);
        const decoder = new StringDecoder('utf8');

        const cent = Buffer.from(nombre_enfermedad);

        // values.push([horaTime, observacion_registro_enfermedad, fechaTime, id_palma, decoder.write(cent), id_etapa_enfermedad, cc_usuario]);
        try {
            await cliente_bd.query('BEGIN');
            let registroQuery;
            if(id_registro_enfermedad !=null ){
                registroQuery = `UPDATE public."REGISTRO_ENFERMEDAD" SET ` + (dada_de_alta !== null ? `dada_de_alta = '${dada_de_alta}'` : "") + ` WHERE id_registro_enfermedad = ${id_registro_enfermedad} RETURNING id_registro_enfermedad;`;
            } else {
                values.push(horaTime, observacion_registro_enfermedad, fechaTime, id_palma, decoder.write(cent), id_etapa_enfermedad, cc_usuario,dada_de_alta);
                registroQuery = format(`INSERT INTO public."REGISTRO_ENFERMEDAD"(hora_registro_enfermedad, observacion_registro_enfermedad, fecha_registro_enfermedad, id_palma, nombre_enfermedad, id_etapa_enfermedad, cc_usuario, dada_de_alta) VALUES (%L) RETURNING id_registro_enfermedad;`, values);
            }
            

            // Se agrega el registro
            const registroResult = await cliente_bd.query(registroQuery);
            const registroId = registroResult.rows[0].id_registro_enfermedad;
            registrosIds.push(registroId);

            // Se agregan las imagenes con el id devuelto por la base de datos central, 
            // diferentes a los de los celulares. Asi evitamos conflictos.
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
                let sqlImagenes = format(`INSERT INTO public."IMAGEN_REGISTRO_ENFERMEDAD"(id_registro_enfermedad, imagen) VALUES %L`, imagenesvalues);
                await cliente_bd.query(sqlImagenes);
                // let sqlImagenes = format(`INSERT INTO public."IMAGEN_REGISTRO_ENFERMEDAD"(id_registro_enfermedad, imagen) VALUES %L`, imagenesvalues);
            }
            await cliente_bd.query('COMMIT');

        } catch (e) {
            console.log(e);
            await cliente_bd.query('ROLLBACK');
        }

    }
    cliente_bd.release();
    return { "success": true, "registrosIds": registrosIds };
}

rutas.route('/movil/enfermedades')
    .get((req, res) => {
        get_enfermedadesTodas().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de enfermedades' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió' });
                console.log(err);
            }
        )
    }).post(authorize(["admin"]), (req, res) => {
        post_enfermedades(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los registros de enfermedad' });
            } else {
                res.status(200).send(rta);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
        // }
    })

rutas.route('/movil/enfermedades/obtenerIds')
    .post(authorize(["admin"]), (req, res) => {
        get_registros_enfermedad_ids(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los ids de los registros de enfermedad' });
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