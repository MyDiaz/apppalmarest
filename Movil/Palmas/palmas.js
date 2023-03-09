const express = require("express");
const config = require('../../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);


var post_palmas = async (req) => {
    var values = [];
    const cliente_bd = await BaseDatos.connect();
    for (i in req.body.data) {
        let body = req.body.data[i];
        const { numero_linea, numero_en_linea, nombre_lote, id_palma, edad_palma, orientacion_palma, estado_palma } = body;
        values.push([numero_linea, numero_en_linea, nombre_lote, id_palma, edad_palma, orientacion_palma, estado_palma]);
    }
    let sql = format(`INSERT INTO public."PALMA"(numero_linea, numero_en_linea, nombre_lote, id_palma, edad_palma, orientacion_palma, estado_palma) VALUES %L`, values);
    let rta = await cliente_bd.query(sql);
    cliente_bd.release();
    return rta;
}
var get_palmasTodas = async () => {
    let consulta = `SELECT * FROM "PALMA"`;
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
                res.status(200).send({ message: 'Se agregé correctamente' });
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
        // }
    })


module.exports = rutas;