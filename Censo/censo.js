const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de un censo registrado en un lote
var get_censos = async() => {
    let consulta =  `SELECT CENSO.id_censo, CENSO.fecha_censo, CENSO.observacion_censo,
                    CENSO.nombre_lote, CENSO.estado_censo, CENSO.nombre_comun_plaga
                    FROM public."CENSO" CENSO `;
    // let consulta = `SELECT C.nombre_comun_plaga, EP.nombre_etapa_plaga, C.fecha_censo, C.estado_censo, C.nombre_lote, C.observacion_censo,
    //     C.numero_individuos, C.id_censo
    //     FROM "ETAPAS_PLAGA" AS EP
    //     INNER JOIN
    //     (
    //     SELECT CENSO.id_censo, CENSO.fecha_censo, CENSO.observacion_censo,
    //             CENSO.nombre_lote, CENSO.estado_censo, CENSO.nombre_comun_plaga
    //     FROM public."CENSO" CENSO
    //     INNER JOIN "CENSO_ETAPAPLAGA" AS CEP ON CENSO.id_censo = CEP.id_censo
    //     ) AS C ON EP.id_etapa_plaga = C.id_etapa_plaga;
    //     `;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}
var get_imagenes_censo = async (id) => {
    let sql = format(`SELECT * FROM public."IMAGEN_CENSO"
    WHERE id_censo = %L `, id);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(sql);
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
    rutas.route('/censos/imagenes/:id')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_imagenes_censo(req.params.id).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener las imagenes del censo' });
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

    module.exports = rutas