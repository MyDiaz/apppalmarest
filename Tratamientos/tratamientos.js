const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

var get_registro_tratamientos = async() => {
    let consulta = `
    SELECT T.id_tratamiento, RE.id_palma, T.fecha_tratamiento,T.hora_tratamiento,
    PA.nombre_producto_agroquimico,T.dosis,T.unidades,T.tipo_control, T.descripcion_procedimiento,
    RE.nombre_enfermedad, EE.etapa_enfermedad, P.nombre_lote
    FROM "TRATAMIENTO" as T
    inner join "PRODUCTO_AGROQUIMICO" as PA
    on PA.id_producto_agroquimico = T.id_agroquimico 
    inner join "REGISTRO_ENFERMEDAD" as RE
    on RE.id_registro_enfermedad = T.id_registro_enfermedad
    left join "ETAPAS_ENFERMEDAD" AS EE
    ON EE.id_etapa_enfermedad = RE.id_etapa_enfermedad
    inner join "PALMA" as P
    ON P.id_palma = RE.id_palma`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    console.log("get_registro_enfermedades", rta);
    return rta;
}

//Retorna el listado de todos los registros de enfermedades  con y sin etapas
rutas.route('/registro_tratamientos')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_registro_tratamientos().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de registros de tratamientos' });
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