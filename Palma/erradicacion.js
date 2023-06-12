const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de las erradicaciones en un lote
var get_erradicaciones = async() => {
    let consulta = `select P.id_palma, E.causa_erradicacion, E.fecha_erradicacion, P.nombre_lote
    from "ERRADICACION" as E
    inner join "PALMA" P
    on P.id_palma = E.id_palma`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/erradicaciones')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_erradicaciones().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los erradicaciones.' });
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