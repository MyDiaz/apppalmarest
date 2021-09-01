const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);


var get_enfermedadesTodas = async() => {
    let consulta = `SELECT * FROM "ENFERMEDAD" where fue_borrado = false;`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    console.log("get_enfermedades", rta);
    return rta;
}


rutas.route('/enfermedadesTodas')
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
})


module.exports = rutas;