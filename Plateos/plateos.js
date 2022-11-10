const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de la cantidad de palmas plateadas de cada registro de plateo
var get_plateos = async() => {
    let consulta = `select "PLATEOS".id_plateos, "PLATEOS"."nombre_lote", total_palmas_plateadas, inicio_plateo , fin_plateo, estado_plateo, tipo_plateo 
    from (select "nombre_lote", sum("cantidad_plateo_diario") as total_palmas_plateadas, "PLATEOS".id_plateos
    from "PLATEOS" inner join  "PLATEO_DIARIO" on "PLATEOS".id_plateos = "PLATEO_DIARIO".id_plateos 
    group by "PLATEOS"."nombre_lote", "PLATEOS".id_plateos) as suma_plateos
    inner join (select id_plateos, min(fecha_plateo_diario) as inicio_plateo from "PLATEO_DIARIO" group by id_plateos) as inicio 
    on inicio.id_plateos = suma_plateos.id_plateos
    inner join (select id_plateos, max(fecha_plateo_diario) as fin_plateo from "PLATEO_DIARIO" group by id_plateos) as fin 
    on fin.id_plateos = suma_plateos.id_plateos
    inner join "PLATEOS"
    on suma_plateos.id_plateos = "PLATEOS".id_plateos;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_plateo = async(id_plateos) => {
    let consulta = `SELECT * FROM "PLATEO_DIARIO" where "id_plateos" = ${id_plateos};`;
    //console.log('consulta: ', consulta)
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/plateos')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_plateos(req.params.id_plateos).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los plateos.' });
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

rutas.route('/plateos/:id_plateos')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_plateo(req.params.id_plateos).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el registro del plateo.' });
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