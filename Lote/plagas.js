const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);


var get_plagasTodas = async () => {
    let consulta = `SELECT * FROM "PLAGA" where fue_borrado = false;`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/plagasTodas')
    .get((req, res) => {
        get_plagasTodas().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de plagas' });
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


module.exports = rutas;
