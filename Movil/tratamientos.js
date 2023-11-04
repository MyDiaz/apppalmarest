const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const { StringDecoder } = require('node:string_decoder');

const BaseDatos = new Pool(config.connectionData);


var post_tratamientos = async (req) => {
    var values = [];
    const cliente_bd = await BaseDatos.connect();
    for (i in req.body.data) {
        let body = req.body.data[i];
        
        const {  hora_tratamiento, fecha_tratamiento, descripcion_procedimiento, id_registro_enfermedad, id_agroquimico, dosis, unidades, tipo_control, cc_usuario } = body;
        const horaTime = new Date(hora_tratamiento).toLocaleTimeString('es',
            { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
        // const fechaTime = Date(fecha_registro_enfermedad);
        const fechaTime = new Date(fecha_tratamiento);
        const decoder = new StringDecoder('utf8');
        const cent = Buffer.from(tipo_control);

        values.push([ horaTime, fechaTime, descripcion_procedimiento, id_registro_enfermedad, id_agroquimico,dosis, unidades, decoder.write(cent), cc_usuario]);
    }
    let sql = format(`INSERT INTO public."TRATAMIENTO"(  hora_tratamiento, fecha_tratamiento, descripcion_procedimiento, id_registro_enfermedad, id_agroquimico, dosis, unidades, tipo_control, cc_usuario ) VALUES %L`, values);
    let rta = await cliente_bd.query(sql);
    cliente_bd.release();

    return rta;
}

rutas.route('/movil/tratamientos')
    .post(authorize(["admin"]), (req, res) => {
        post_tratamientos(req).then(rta => {
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