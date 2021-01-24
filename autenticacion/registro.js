const express = require('express');
const config = require('../config');
const { Pool } = require('pg');
const BaseDatos = new Pool(config.connectionData);
var rutas = express.Router();
const encriptar_clave = require('./util').encriptar_clave;

var consulta_registrar = async(req) => {
    let consulta = `INSERT INTO public."USUARIO"(
        cc_usuario, 
        nombre_usuario, 
        cargo_empresa, 
        contrasena_usuario)
        VALUES ('${req.body.cc_usuario}', '${decodeURIComponent(req.body.nombre_usuario)}',
        '${decodeURIComponent(req.body.cargo_empresa)}', '${encriptar_clave(decodeURIComponent(req.body.contrasena_usuario))}');`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.post('/registro', (req, res) => {
    //pregunta si todos los campos requeridos están presentes 
    if (!req.body.cc_usuario || !req.body.nombre_usuario || !req.body.cargo_empresa || !req.body.contrasena_usuario) {
        res.status(400).send({
            message: 'Todos los campos son requeridos'
        });
    } else {
        consulta_registrar(req).then(rta => {
            res.status(200).send({
                message: `El usuario se registro exitosamente`
            });
        }).catch(err => {
            console.log(err);
            res.status(400).send({
                message: `El usuario no se pudo registrar`
            });
        })
    }
});

module.exports = rutas;