const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const decode = require('unescape');
const { StringDecoder } = require('node:string_decoder');

const BaseDatos = new Pool(config.connectionData);


var get_enfermedadesTodas = async () => {
    let consulta = `SELECT * FROM "ENFERMEDAD" where fue_borrado = false;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var post_enfermedades = async (req) => {
    var values = [];
    const cliente_bd = await BaseDatos.connect();
    for (i in req.body.data) {
        let body = req.body.data[i];

        const { hora_registro_enfermedad, observacion_registro_enfermedad, fecha_registro_enfermedad, id_palma, nombre_enfermedad, id_etapa_enfermedad, responsable } = body;
        const horaTime = new Date(hora_registro_enfermedad).toLocaleTimeString('es',
            { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
        // const fechaTime = Date(fecha_registro_enfermedad);
        const fechaTime = new Date(fecha_registro_enfermedad);
        const decoder = new StringDecoder('utf8');
        
        const cent = Buffer.from(nombre_enfermedad);

        values.push([horaTime, observacion_registro_enfermedad, fechaTime, id_palma, decoder.write(cent), id_etapa_enfermedad, responsable]);
    }
    let sql = format(`INSERT INTO public."REGISTRO_ENFERMEDAD"(hora_registro_enfermedad, observacion_registro_enfermedad, fecha_registro_enfermedad, id_palma, nombre_enfermedad, id_etapa_enfermedad, responsable) VALUES %L`, values);
    console.log(sql);
    let rta = await cliente_bd.query(sql);
    cliente_bd.release();

    return sql;
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
                res.status(200).send({ message: 'Se agreguó correctamente' });
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
        // }
    })


module.exports = rutas;