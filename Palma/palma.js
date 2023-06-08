const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de un censo registrado en un lote
var get_historia_clinica = async() => {
    let consulta = `select P.id_palma, RE.nombre_enfermedad, EE.etapa_enfermedad, RE.fecha_registro_enfermedad,
    PA.nombre_producto_agroquimico, T.fecha_tratamiento, P.estado_palma, P.nombre_lote
    from "REGISTRO_ENFERMEDAD" as RE
    left join "ETAPAS_ENFERMEDAD" as EE
    ON EE.id_etapa_enfermedad = RE.id_etapa_enfermedad
    left join "TRATAMIENTO" as T
    on T.id_registro_enfermedad = RE.id_registro_enfermedad
    left join "PRODUCTO_AGROQUIMICO" as PA
    on T.id_agroquimico = PA.id_producto_agroquimico
    inner join "PALMA" AS P
    on P.id_palma = RE.id_palma`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/historia_clinica_palma')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_historia_clinica().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener la historia clínica de la palma.' });
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