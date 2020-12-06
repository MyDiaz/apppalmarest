const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

//retorna el nombre de todos los lotes registrados en la base de datos
var get_usuario = async(req) => {
    let consulta = `SELECT * FROM "USUARIO" where cc_usuario = '${req.params.cc}';`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/usuario/:cc')
    .get((req, res) => {
        get_usuario(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario" });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió' });
            }
        )
    })

module.exports = rutas;