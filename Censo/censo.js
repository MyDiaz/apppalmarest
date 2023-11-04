const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de un censo registrado en un lote
var get_censos = async() => {
    let consulta = `SELECT C.nombre_comun_plaga, EP.nombre_etapa_plaga, C.fecha_censo, C.estado_censo, C.nombre_lote, C.observacion_censo,
        C.numero_individuos
        FROM "ETAPAS_PLAGA" AS EP
        INNER JOIN
        (
        SELECT CENSO.id_censo, CEP.id_etapa_plaga, CENSO.fecha_censo, CENSO.numero_individuos, CENSO.observacion_censo,
                CENSO.nombre_lote, CENSO.estado_censo, CENSO.nombre_comun_plaga
        FROM public."CENSO" CENSO
        INNER JOIN "CENSO_ETAPAPLAGA" AS CEP ON CENSO.id_censo = CEP.id_censo
        ) AS C ON EP.id_etapa_plaga = C.id_etapa_plaga;
        `;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/censos')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_censos().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los censos.' });
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