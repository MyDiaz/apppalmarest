const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);
const { StringDecoder } = require('node:string_decoder');

var post_fertilizaciones = async (req) => {
    var diarias;
    const cliente_bd = await BaseDatos.connect();
    let fertilizacionesIds = [];
    for (i in req.body.data) {
        var auxfertilizacion = req.body.data[i]["fertilizacion"];
        var diarias = req.body.data[i]["diarias"];

        const decoder = new StringDecoder('utf8');
        var fertilizacionvalues = [];
        const { id_fertilizacion, nombre_lote, estado_fertilizacion } = auxfertilizacion;
        const cent = Buffer.from(nombre_lote);
        fertilizacionvalues.push(decoder.write(cent), estado_fertilizacion);

        // Obtenemos el fertilizacion de la base de datos central si existe
        //Si no existe la crea
        if (!id_fertilizacion) {
            try {
                await cliente_bd.query('BEGIN');
                const fertilizacionQuery = format(`INSERT INTO public."FERTILIZACIONES"(nombre_lote, estado_fertilizacion) VALUES (%L) RETURNING id_fertilizacion`, fertilizacionvalues);

                // Se agrega el fertilizacion
                const fertilizacionResult = await cliente_bd.query(fertilizacionQuery);
                const fertilizacionId = fertilizacionResult.rows[0].id_fertilizacion;
                fertilizacionesIds.push(fertilizacionId);

                // Se agregan los fertilizaciones diarios con el id devuelto por la base de datos central, 
                // diferentes a los de los celulares. Asi evitamos conflictos.
                var fertilizaciondiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxfertilizaciondiaria = diarias[j];
                        console.log(auxfertilizaciondiaria);
                        const { fecha_fertilizacion_diaria, cantidad_fertilizacion_diaria, dosis, unidades, nombre_fertilizante, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin } = auxfertilizaciondiaria;
                        fertilizaciondiariavalues.push([fertilizacionId, fecha_fertilizacion_diaria, cantidad_fertilizacion_diaria, dosis, unidades, nombre_fertilizante, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin]);
                    }
                    let sqlPlateoDiaria = format(`INSERT INTO public."FERTILIZACION_DIARIA"(id_fertilizacion, fecha_fertilizacion_diaria, cantidad_fertilizacion_diaria, dosis,unidades,nombre_fertilizante, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin) VALUES %L`, fertilizaciondiariavalues);
                    console.log(sqlPlateoDiaria);
                    await cliente_bd.query(sqlPlateoDiaria);
                }
                await cliente_bd.query('COMMIT');
            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
                return { "success": false, "fertilizacionesIds": [] };
            }
        } else {
            try {
                fertilizacionesIds.push(-1);
                await cliente_bd.query('BEGIN');

                let fertilizacionQuery = `UPDATE public."FERTILIZACIONES" SET ` + (estado_fertilizacion !== null ? `estado_fertilizacion = '${estado_fertilizacion}'` : "") + ` WHERE id_fertilizacion = ${id_fertilizacion}`;
                if (estado_fertilizacion) {
                    await cliente_bd.query(fertilizacionQuery);
                }

                var fertilizaciondiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxfertilizaciondiaria = diarias[j];
                        const { fecha_fertilizacion_diaria, cantidad_fertilizacion_diaria, dosis, unidades, nombre_fertilizante, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin } = auxfertilizaciondiaria;
                        fertilizaciondiariavalues.push([id_fertilizacion, fecha_fertilizacion_diaria, cantidad_fertilizacion_diaria, dosis, unidades, nombre_fertilizante, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin]);
                    }
                    let sqlPlateoDiaria = format(`INSERT INTO public."FERTILIZACION_DIARIA"(id_fertilizacion, fecha_fertilizacion_diaria, cantidad_fertilizacion_diaria, dosis, unidades, nombre_fertilizante, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin) VALUES %L`, fertilizaciondiariavalues);
                    await cliente_bd.query(sqlPlateoDiaria);
                }
                await cliente_bd.query('COMMIT');

            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
                return { "success": false, "fertilizacionesIds": [] };

            }
        }

    }
    cliente_bd.release();
    return { "success": true, "fertilizacionesIds": fertilizacionesIds };
}


rutas.route('/movil/fertilizaciones')
    .post(authorize(["admin"]), (req, res) => {
        post_fertilizaciones(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los fertilizaciones' });
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