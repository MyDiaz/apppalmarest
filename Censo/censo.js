const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de un censo registrado en un lote
var get_censos = async() => {
    let consulta = `select C.nombre_comun_plaga, EP.nombre_etapa_plaga, C.fecha_censo,C.estado_censo, C.nombre_lote,C.presencia_lote, C.presencia_sector, C.observacion_censo
    from "ETAPAS_PLAGA" as EP
    inner join
    (
        select CENSO.id_censo,CEP.id_etapa_plaga, CENSO.fecha_censo, CENSO.presencia_lote, CENSO.presencia_sector, 
        CENSO.observacion_censo, CENSO.nombre_lote, CENSO.estado_censo, CENSO.nombre_comun_plaga
        from public."CENSO" CENSO
        inner join "CENSO_ETAPAPLAGA" as CEP
        on CENSO.id_censo = CEP.id_censo
    ) as C
    on EP.id_etapa_plaga = C.id_etapa_plaga`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
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

    module.exports = rutas