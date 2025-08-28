const express = require("express");
const config = require("../config");
const { Pool } = require("pg");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de una fumigacion registrada en un lote
var get_fumigaciones = async() => {
    let consulta = `SELECT id_fumigacion, EP.nombre_etapa_plaga, EP.nombre_comun_plaga, PA.nombre_producto_agroquimico, 
        dosis, unidades, fecha_fumigacion, 
        hora_fumigacion, tipo_control, descripcion_labor, 
        cantidad_aplicada_por_hectarea, cantidad_palmas, C.nombre_lote
    FROM "FUMIGACION" AS F
    INNER JOIN "PRODUCTO_AGROQUIMICO" AS PA
    ON PA.id_producto_agroquimico = F.id_producto_agroquimico
    INNER JOIN "CENSO" AS C
    ON C.id_censo = F.id_censo
    INNER JOIN "CENSO_ETAPAPLAGA" AS CEP
    ON C.id_censo = CEP.id_censo
    INNER JOIN "ETAPAS_PLAGA" AS EP
    ON CEP.id_etapa_plaga = EP.id_etapa_plaga;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route("/fumigaciones").get(authorize(["admin", "user"]), (req, res) => {
  get_fumigaciones()
    .then((rta) => {
      if (!rta) {
        res
          .status(400)
          .send({ message: "No se pudo obtener los fumigaciones." });
      } else {
        res.status(200).send(rta.rows);
      }
    })
    .catch((err) => {
      res.status(400).send({ message: `Algo inesperado ocurrió` });
      console.log(err);
    });
});

module.exports = rutas;
