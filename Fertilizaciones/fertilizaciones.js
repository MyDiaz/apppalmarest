const express = require("express");
const config = require('../config');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = require("../db");

//retorna todas las fertilizaciones activas y finalizadas de la plantación 
var get_fertilizaciones = async() => {
    let consulta = `select F.id_fertilizacion , F.nombre_lote, F.estado_fertilizacion,subquery.fecha_inicio, subquery.fecha_fin, subquery.total_palmas
    from "FERTILIZACIONES" as F
    inner join
    (select FF.id_fertilizacion, FI.fecha_inicio, FF.fecha_fin, FI.total_palmas
    from 
    (select id_fertilizacion, min(fecha_fertilizacion_diaria) as fecha_inicio, sum(cantidad_fertilizacion_diaria) as total_palmas
    from "FERTILIZACION_DIARIA"
    group by(id_fertilizacion)) as FI
    inner join 
    (select id_fertilizacion, max(fecha_fertilizacion_diaria) as fecha_fin
    from "FERTILIZACION_DIARIA" as FD
    group by(id_fertilizacion)) as FF
    on FI.id_fertilizacion = FF.id_fertilizacion) as subquery
    on F.id_fertilizacion = subquery.id_fertilizacion;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_fertilizacion = async(id_fertilizacion) => {
    let consulta = `SELECT * FROM public."FERTILIZACION_DIARIA" where "id_fertilizacion" = ${id_fertilizacion};`;
    //console.log('consulta: ', consulta)
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/fertilizaciones')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_fertilizaciones().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener las fertilizaciones.' });
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

rutas.route('/fertilizacion/:id_fertilizacion')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_fertilizacion(req.params.id_fertilizacion).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el registro de la fertilización.' });
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