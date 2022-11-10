const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de la cantidad de palmas podadas de cada poda
var get_podas = async() => {
    let consulta = `select "PODAS".id_poda, "PODAS"."nombre_lote", total_palmas_podadas, inicio_poda, fin_poda, estado_poda 
    from (select "nombre_lote", sum("cantidad_poda_diaria") as total_palmas_podadas, "PODAS".id_poda
    from "PODAS" inner join  "PODA_DIARIA" on "PODAS".id_poda = "PODA_DIARIA".id_poda 
    group by "PODAS"."nombre_lote", "PODAS".id_poda) as suma_podas
    inner join (select id_poda, min(fecha_poda_diaria) as inicio_poda from "PODA_DIARIA" group by id_poda) as inicio 
    on inicio.id_poda = suma_podas.id_poda
    inner join (select id_poda, max(fecha_poda_diaria) as fin_poda from "PODA_DIARIA" group by id_poda) as fin 
    on fin.id_poda = suma_podas.id_poda
    inner join "PODAS"
    on suma_podas.id_poda = "PODAS".id_poda;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_poda = async(id_poda) => {
    let consulta = `SELECT * FROM "PODA_DIARIA" where "id_poda" = ${id_poda};`;
    //console.log('consulta: ', consulta)
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/podas')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_podas(req.params.id_poda).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener las podas.' });
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

rutas.route('/poda/:id_poda')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_poda(req.params.id_poda).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener la poda.' });
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