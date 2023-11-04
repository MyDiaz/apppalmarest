const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

var getAgroquimicos = async (req) => {
    let consulta = `SELECT * FROM "PRODUCTO_AGROQUIMICO" where fue_borrado = false;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/agroquimicoTodas')
    .get(authorize(["admin", "user"]), (req, res) => {
        getAgroquimicos().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de agroquimicos.' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                console.log('Algo inesperado ocurrió obteniendo el listado de agroquimicos', err);
                res.status(400).send({ message: 'Algo inesperado ocurrió obteniendo el listado de agroquimicos' });
            }
        )
    })


module.exports = rutas