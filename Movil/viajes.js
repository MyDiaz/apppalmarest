const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);


var post_viajes = async (req) => {
    var values = [];
    let viajesIds = [];
    const cliente_bd = await BaseDatos.connect();

    for (i in req.body.data) {
        try {
            await cliente_bd.query('BEGIN');
            let body = req.body.data[i];
            const { idViaje, kilos_total_racimos_extractora, kilos_total_racimos_finca, hora_cargue, hora_salida, cc_usuario, fecha_viaje } = body;

            const horaCargue = new Date(hora_cargue).toLocaleTimeString('es',
                { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
            const horaSalida = new Date(hora_salida).toLocaleTimeString('es',
                { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
            const fechaTime = new Date(fecha_viaje);

            if (!idViaje) {
                let viajeValues = [];
                viajeValues.push(kilos_total_racimos_extractora, horaCargue, horaSalida, cc_usuario, fechaTime, kilos_total_racimos_finca);
                const viajeQuery = format(`INSERT INTO public."VIAJE"(kilos_total_racimos_extractora, hora_cargue, hora_salida, cc_usuario, fecha_viaje, kilos_total_racimos_finca) VALUES (%L) RETURNING id_viaje;`, viajeValues);
                const viajeResult = await cliente_bd.query(viajeQuery);
                const viajeId = viajeResult.rows[0].id_viaje;
                viajesIds.push(viajeId);
            } else {
                viajesIds.push(-1);
                let viajeQuery = `UPDATE public."VIAJE" SET kilos_total_racimos_extractora = '${kilos_total_racimos_extractora}' WHERE id_viaje = ${idViaje}`;
                await cliente_bd.query(viajeQuery);
            }
            await cliente_bd.query('COMMIT');
        } catch (e) {
            console.log(e);
            await cliente_bd.query('ROLLBACK');
            return { "success": false, "viajesIds": [] };

        }
    }
    cliente_bd.release();
    return { "success": true, "viajesIds": viajesIds };
}

rutas.route('/movil/viajes')
    .post(authorize(["admin"]), (req, res) => {
        post_viajes(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar los viajes' });
            } else {
                res.status(200).send(rta);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
        // }
    })


module.exports = rutas;