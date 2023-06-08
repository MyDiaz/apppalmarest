const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de las precipitaciones
var get_precipitaciones = async() => {
    let consulta = `SELECT * FROM public."PRECIPITACION"
    ORDER BY id_precipitacion ASC `;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/precipitaciones')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_precipitaciones().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los precipitaciones.' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: `Algo inesperado ocurrió` });
                console.log(err);
            }
        )
    })

    module.exports = rutas