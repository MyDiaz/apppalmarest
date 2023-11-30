const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);
const { StringDecoder } = require('node:string_decoder');


var post_cosechas = async (req) => {
    var diarias;
    const cliente_bd = await BaseDatos.connect();
    let cosechasIds = [];
    for (i in req.body.data) {
        var auxcosecha = req.body.data[i]["cosecha"];
        var diarias = req.body.data[i]["diarias"];

        const decoder = new StringDecoder('utf8');
        var cosechavalues = [];
        const { id_cosecha, nombre_lote, id_viaje, estado_cosecha } = auxcosecha;
        const cent = Buffer.from(nombre_lote);
        cosechavalues.push(decoder.write(cent), id_viaje, estado_cosecha);

        // Obtenemos la cosecha de la base de datos central si existe
        //Si no existe la crea
        if (!id_cosecha) {
            try {
                await cliente_bd.query('BEGIN');
                const cosechaQuery = format(`INSERT INTO public."COSECHA"(nombre_lote, id_viaje, estado_cosecha) VALUES (%L) RETURNING id_cosecha;`, cosechavalues);

                // Se agrega la cosecha
                const cosechaResult = await cliente_bd.query(cosechaQuery);
                const cosechaId = cosechaResult.rows[0].id_cosecha;
                cosechasIds.push(cosechaId);

                // Se agregan las cosechas diarias con el id devuelto por la base de datos central, 
                // diferentes a los de los celulares. Asi evitamos conflictos.
                var cosechadiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxcosechadiaria = diarias[j];
                        const { fecha_cosecha, kilos_racimos_dia, cantidad_racimos_dia, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin } = auxcosechadiaria;
                        cosechadiariavalues.push([cosechaId, fecha_cosecha, kilos_racimos_dia, cantidad_racimos_dia, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin]);
                    }
                    let sqlCosechaDiaria = format(`INSERT INTO public."COSECHA_DIARIA"(id_cosecha, fecha_cosecha,kilos_racimos_dia,cantidad_racimos_dia,cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin) VALUES %L`, cosechadiariavalues);
                    await cliente_bd.query(sqlCosechaDiaria);
                }

                await cliente_bd.query('COMMIT');
            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
                return { "success": false, "cosechasIds": cosechasIds };
            }
        } else {
            try {
                cosechasIds.push(-1);
                await cliente_bd.query('BEGIN');

                let cosechaQuery = `UPDATE public."COSECHA" SET ` + (id_viaje !== null ? `id_viaje = '${id_viaje}', ` : "") + (estado_cosecha !== null ? `estado_cosecha = '${estado_cosecha}'` : "") + ` WHERE id_cosecha = ${id_cosecha}`;
                if (id_viaje || estado_cosecha) {
                    console.log(cosechaQuery);
                    await cliente_bd.query(cosechaQuery);
                }

                var cosechadiariavalues = [];
                if (diarias.length > 0) {
                    for (j in diarias) {
                        var auxcosechadiaria = diarias[j];
                        const { fecha_cosecha, kilos_racimos_dia, cantidad_racimos_dia, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin } = auxcosechadiaria;
                        cosechadiariavalues.push([id_cosecha, fecha_cosecha, kilos_racimos_dia, cantidad_racimos_dia, cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin]);
                    }
                    let sqlCosechaDiaria = format(`INSERT INTO public."COSECHA_DIARIA"(id_cosecha, fecha_cosecha,kilos_racimos_dia,cantidad_racimos_dia,cc_usuario,linea_inicio, numero_inicio, orientacion_inicio, linea_fin, numero_fin, orientacion_fin) VALUES %L`, cosechadiariavalues);
                    await cliente_bd.query(sqlCosechaDiaria);
                }
                await cliente_bd.query('COMMIT');

            } catch (e) {
                console.log(e);
                await cliente_bd.query('ROLLBACK');
                return { "success": false, "cosechasIds": cosechasIds };

            }
        }

    }
    cliente_bd.release();
    return { "success": true, "cosechasIds": cosechasIds };

}


var get_cosechas = async () => {
    let consulta = `SELECT * FROM "COSECHA"`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}


rutas.route('/movil/cosechas')
    .get((req, res) => {
        get_cosechas().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de palmas' });
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
        post_cosechas(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar las palmas' });
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