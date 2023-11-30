const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');

const BaseDatos = new Pool(config.connectionData);

var postPrecipitacion = async (req) => {
    var values = [];
    const cliente_bd = await BaseDatos.connect();
    for (i in req.body.data) {
        let body = req.body.data[i];
        console.log(i);
        console.log(body);
        const { fecha_registro_precipitacion, cantidad_precipitacion, cc_usuario} = body;
        values.push([fecha_registro_precipitacion, cantidad_precipitacion, cc_usuario]);
    }
    let sql = format(`INSERT INTO public."PRECIPITACION"(fecha_registro_precipitacion, cantidad_precipitacion, cc_usuario) VALUES %L`, values);
    try {
        console.log(sql);
        await cliente_bd.query(sql);
        cliente_bd.release();
        return { "success": true};
    } catch (error) {
        console.log('Error en la consulta:', error);
        return { "success": false};
    }
}

rutas.route('/movil/precipitaciones')
    .post(authorize(["admin", "user"]), (req, res) => {
        postPrecipitacion(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar la precipitación' });
            } else {
                res.status(200).send(rta);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
    })


module.exports = rutas