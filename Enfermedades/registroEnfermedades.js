const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');

const BaseDatos = new Pool(config.connectionData);


var get_registro_enfermedades = async () => {
    let consulta = `
    SELECT P.id_palma, "REGISTRO_ENFERMEDAD".nombre_enfermedad,"REGISTRO_ENFERMEDAD".id_registro_enfermedad,
    "ETAPAS_ENFERMEDAD".etapa_enfermedad, 
    P.nombre_lote,
    fecha_registro_enfermedad,
    observacion_registro_enfermedad
    FROM "REGISTRO_ENFERMEDAD"
    LEFT JOIN "ENFERMEDAD" ON "REGISTRO_ENFERMEDAD".nombre_enfermedad = "ENFERMEDAD".nombre_enfermedad
    LEFT JOIN "ETAPAS_ENFERMEDAD" ON "REGISTRO_ENFERMEDAD".id_etapa_enfermedad = "ETAPAS_ENFERMEDAD".id_etapa_enfermedad
    inner join "PALMA" as P
    on "REGISTRO_ENFERMEDAD".id_palma = P.id_palma;`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    console.log("get_registro_enfermedades", rta);
    return rta;
}

var get_imagenes_registro_enfermedad = async (id) => {
    let sql = format(`SELECT * FROM public."IMAGEN_REGISTRO_ENFERMEDAD"
    WHERE id_registro_enfermedad = %L `, id);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(sql);
    cliente_bd.release();
    return rta;
}

//Retorna el listado de todos los registros de enfermedades  con y sin etapas
rutas.route('/registro-enfermedades')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_registro_enfermedades().then(rta => {
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

rutas.route('/registro-enfermedades/imagenes/:id')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_imagenes_registro_enfermedad(req.params.id).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener las imagenes del registro' });
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