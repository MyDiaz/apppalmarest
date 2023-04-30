const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);
const { StringDecoder } = require('node:string_decoder');

var post_plateos = async (req) => {
    var diarias;
    const cliente_bd = await BaseDatos.connect();
    let plateosIds = [];
    for (i in req.body.data) {
        var auxplateo = req.body.data[i]["plateo"];
        var diarias = req.body.data[i]["diarias"];

        const decoder = new StringDecoder('utf8');
        var plateovalues = [];
        const { idPlateos, nombre_lote, estadoPlateo  } = auxplateo;
        const cent = Buffer.from(nombre_lote);
        plateovalues.push(decoder.write(cent), estadoPlateo);

        // Obtenemos el plateo de la base de datos central si existe
        //Si no existe la crea
        if (!idPlateos) {
            try {
                await cliente_bd.query('BEGIN');
                const plateoQuery = format(`INSERT INTO public."PLATEOS"(nombre_lote, estado_plateo) VALUES (%L) RETURNING id_plateos;`, plateovalues);

                // Se agrega el plateo
                const plateoResult = await cliente_bd.query(plateoQuery);
                const plateoId = plateoResult.rows[0].id_plateos;
                plateosIds.push(plateoId);

                // Se agregan los plateos diarios con el id devuelto por la base de datos central, 
                // diferentes a los de los celulares. Asi evitamos conflictos.
                var plateodiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxplateodiaria = diarias[j];
                        console.log(auxplateodiaria);
                        const { fecha_plateo_diario, cantidad_plateo_diario, tipo_plateo, cc_usuario } = auxplateodiaria;
                        const cent = Buffer.from(tipo_plateo);
                        plateodiariavalues.push([plateoId, fecha_plateo_diario, cantidad_plateo_diario, decoder.write(cent), cc_usuario]);
                    }
                    let sqlPlateoDiaria = format(`INSERT INTO public."PLATEO_DIARIO"(id_plateos, fecha_plateo_diario, cantidad_plateo_diario, tipo_plateo, cc_usuario) VALUES %L`, plateodiariavalues);
                        console.log(sqlPlateoDiaria);
                        await cliente_bd.query(sqlPlateoDiaria);
                }
                await cliente_bd.query('COMMIT');
            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
            }
        } else {
            try {
                plateosIds.push(-1);
                await cliente_bd.query('BEGIN');

                let plateoQuery = `UPDATE public."PLATEOS" SET ` + (estadoPlateo !== null ? `estado_plateo = '${estadoPlateo}'` : "") + ` WHERE id_plateos = ${idPlateos}`;
                if(estadoPlateo){
                    await cliente_bd.query(plateoQuery);
                }

                var plateodiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxplateodiaria = diarias[j];
                        const { fecha_plateo_diario, cantidad_plateo_diario, tipo_plateo, cc_usuario } = auxplateodiaria;
                        const cent = Buffer.from(tipo_plateo);
                        plateodiariavalues.push([idPlateos, fecha_plateo_diario, cantidad_plateo_diario, decoder.write(cent), cc_usuario]);
                    }
                    let sqlPlateoDiaria = format(`INSERT INTO public."PLATEO_DIARIO"(id_plateos, id_plateo_diario, fecha_plateo_diario, cantidad_plateo_diario, tipo_plateo, cc_usuario) VALUES %L`, plateodiariavalues);
                    await cliente_bd.query(sqlPlateoDiaria);
                }
                await cliente_bd.query('COMMIT');

            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
            }
        }

    }
    cliente_bd.release();
    return { "success": true, "plateosIds": plateosIds };
}


rutas.route('/movil/plateos')
    .post(authorize(["admin"]), (req, res) => {
        post_plateos(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los plateos' });
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