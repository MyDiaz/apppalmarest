const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna todas las cosecvhas y el registro de los kilos y cantidad de racimos cultivados de cada cosecha
var get_cosechas = async() => {
    let consulta = `select "COSECHA".id_cosecha, "COSECHA"."nombre_lote", kilos_totales, racimos_totales, inicio_cosecha, fin_cosecha, estado_cosecha
    from (select "nombre_lote", sum("kilos_racimos_dia") as kilos_totales, sum(cantidad_racimos_dia) as racimos_totales, "COSECHA".id_cosecha
    from "COSECHA" inner join  "COSECHA_DIARIA" on "COSECHA".id_cosecha = "COSECHA_DIARIA".id_cosecha 
    group by "COSECHA"."nombre_lote", "COSECHA".id_cosecha) as suma_cosecha
    inner join (select id_cosecha, min(fecha_cosecha) as inicio_cosecha from "COSECHA_DIARIA" group by id_cosecha) as inicio 
    on inicio.id_cosecha = suma_cosecha.id_cosecha
    inner join (select id_cosecha, max(fecha_cosecha) as fin_cosecha from "COSECHA_DIARIA" group by id_cosecha) as fin 
    on fin.id_cosecha = suma_cosecha.id_cosecha
    inner join "COSECHA"
    on suma_cosecha.id_cosecha = "COSECHA".id_cosecha ;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_cosecha = async(id_cosecha) => {
    let consulta = `SELECT * FROM "COSECHA_DIARIA" where "id_cosecha" = ${id_cosecha};`;
    //console.log('consulta: ', consulta)
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/cosechas')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_cosechas(req.params.id_cosecha).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener las cosechas.' });
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

rutas.route('/cosecha/:id_cosecha')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_cosecha(req.params.id_cosecha).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener la cosecha.' });
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