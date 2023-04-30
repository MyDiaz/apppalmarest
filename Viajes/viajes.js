const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de los viajes
var get_viajes = async() => {
    let consulta = `select  string_agg(C.nombre_lote, E'\n') as nombres_lotes, string_agg(to_char(C.id_cosecha, '999'), ', ') as ids_cosechas, 
    V.hora_cargue, V.hora_salida, V.id_viaje, V.fecha_viaje, V.kilos_total_racimos_finca, 
    sum(CD.kilos_sumados) as kilos_totales_calculados, V.kilos_total_racimos_extractora
        from "VIAJE" AS V
        inner join "COSECHA" AS C
        on V.id_viaje = C.id_viaje
        inner join (
            SELECT id_cosecha, sum(kilos_racimos_dia) as kilos_sumados
            FROM public."COSECHA_DIARIA"
            GROUP BY id_cosecha) as CD
        on C.id_cosecha = CD.id_cosecha
        group by V.id_viaje;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/viajes')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_viajes().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los viajes.' });
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