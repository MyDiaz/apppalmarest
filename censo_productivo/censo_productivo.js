const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna todas los registro del censo productivo  de cada lote
var get_censo_productivo = async() => {
    let consulta = `SELECT * FROM public."CENSO_PRODUCTIVO";`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/censo-productivo')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_censo_productivo().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los registros de censo productivo.' });
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