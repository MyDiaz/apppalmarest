const express = require("express");
const config = require('../../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);


var post_registro_enfermedad = async (req) => {
        let consulta = `INSERT INTO public."REGISTRO_ENFERMEDAD"( nombre_enfermedad,
        "procedimiento_tratamiento_enfermedad") VALUES 
        ( '${decodeURIComponent(req.body.nombre_enfermedad)}' , '${decodeURIComponent(req.body.procedimiento_tratamiento_enfermedad)}' );`
        const cliente_bd = await BaseDatos.connect();
        let rta = await cliente_bd.query(consulta);
        cliente_bd.release();
        return rta;

}

rutas.route('/enfermedades')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_enfermedades().then(rta => {
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
    })
    .post(authorize(["admin"]), (req, res) => {
        console.log("req.body.nombre_enfermedad", req.body.nombre_enfermedad);
        console.log("req.body.procedimiento_tratamiento_enfermedad", req.body.procedimiento_tratamiento_enfermedad);
        if (!req.body.nombre_enfermedad || !req.body.procedimiento_tratamiento_enfermedad) {
            res.status(400).send({ message: 'Ingrese todos los campos' });
        } else {
            post_enfermedad(req).then(rta => {
                if (!rta) {
                    res.status(400).send({ message: 'No se pudo insertar la enfermedad' });
                } else {
                    res.status(200).send({ message: 'Se agregé correctamente' });
                }
            }).catch(err => {
                console.log(err);
                res.status(500).send({ message: 'Algo inesperado ocurrió' })
            })
        }
    })