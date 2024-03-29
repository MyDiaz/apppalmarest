const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);


var post_palmas = async (req) => {
    var values = [];
    const idsCreados = [];
    const cliente_bd = await BaseDatos.connect();
    for (i in req.body.data) {
        let body = req.body.data[i];
        const { numero_linea, numero_en_linea, nombre_lote,  orientacion_palma, estado_palma } = body;
        values.push([numero_linea, numero_en_linea, nombre_lote, orientacion_palma, estado_palma]);
    }
    let sql = format(`INSERT INTO public."PALMA"(numero_linea, numero_en_linea, nombre_lote, orientacion_palma, estado_palma) VALUES %L ON CONFLICT (numero_linea, numero_en_linea, orientacion_palma) DO UPDATE
    SET estado_palma = EXCLUDED.estado_palma 
    RETURNING id_palma`, values);
    try {
        let rta = await cliente_bd.query(sql);
        console.log(rta);
        // Accede a los IDs creados
        rta.rows.forEach(row => {
            idsCreados.push(row.id_palma);
        });

        cliente_bd.release();
                return { "success": true, "palmasIds": idsCreados };
    } catch (error) {
        console.error('Error en la consulta:', error);
        return { "success": false, "palmasIds": [] };

    }
}
var get_palmasTodas = async () => {
    let consulta = `SELECT * FROM "PALMA"`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_palmasLote = async (nombreLote) => {
    let consulta = `SELECT * FROM "PALMA" WHERE nombre_lote = '${nombreLote}';`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}


rutas.route('/movil/palmas')
    .get((req, res) => {
        get_palmasTodas().then(rta => {
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
        post_palmas(req).then(rta => {
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

rutas.route('/movil/palmas/:nombre_lote')
    .get(authorize(["admin"]), (req, res) => {
        get_palmasLote(req.params.nombre_lote).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de palmas.' });
            } else {
                res.status(200).send(rta.rows);
                console.log(rta);
            }
        }).catch(err => {
            console.log('Algo inesperado ocurrió obteniendo el listado de palmas', err);
            res.status(500).send({ message: 'Algo inesperado ocurrió obteniendo el listado de palmas.' })
        })
    })

module.exports = rutas;