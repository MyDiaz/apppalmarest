const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const { StringDecoder } = require('node:string_decoder');

const BaseDatos = new Pool(config.connectionData);


var post_aplicaciones = async (req) => {
    var values = [];
    const cliente_bd = await BaseDatos.connect();
    for (i in req.body.data) {
        let body = req.body.data[i];
        
        const { dosis, area, fecha_hora_aplicacion, fecha_hora_reingreso, cc_usuario, id_censo, id_agroquimico, unidades } = body;
     
        const fechaAplicacion = new Date(fecha_hora_aplicacion);
        const fechaReingreso = new Date(fecha_hora_reingreso);

        values.push([ dosis, area, fechaAplicacion, fechaReingreso, cc_usuario, id_censo, id_agroquimico, unidades]);
    }
    let sql = format(`INSERT INTO public."APLICACION"( dosis, area, fecha_hora_aplicacion, fecha_hora_reingreso, cc_usuario, id_censo, id_agroquimico, unidades ) VALUES %L`, values);
    let rta = await cliente_bd.query(sql);
    cliente_bd.release();

    return rta;
}

rutas.route('/movil/aplicaciones')
    .post(authorize(["admin"]), (req, res) => {
        post_aplicaciones(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los tratamientos' });
            } else {
                res.status(200).send({ message: 'Se agregó correctamente' });
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
    })


module.exports = rutas;