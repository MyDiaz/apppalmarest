const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const config = require('../config');
const express = require('express');
const BaseDatos = new Pool(config.connectionData);
var rutas = express.Router();

var encriptar_clave = (clave) => {
    return bcrypt.hashSync(clave, 10);
}

var consulta_registrar = async(req) => {
    let consulta = `INSERT INTO public."USUARIO"(
        cc_usuario, nombre_usuario, rol, cargo, contrasena_usuario)
        VALUES ('${req.body.cc_usuario}', '${req.body.nombre_usuario}','${req.body.rol}',
        '${req.body.cargo}', '${encriptar_clave(req.body.contrasena_usuario)}');`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}