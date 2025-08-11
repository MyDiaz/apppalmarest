const express = require("express");
const config = require("../config");
const { Pool } = require("pg");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require("pg-format");

const BaseDatos = new Pool(config.connectionData);

//retorna el registro de un censo registrado en un lote
var get_censos = async() => {
    let consulta = `SELECT *
    FROM public."CENSO"
    INNER JOIN public."CENSO_ETAPAPLAGA"
    ON public."CENSO".id_censo = public."CENSO_ETAPAPLAGA".id_censo
    INNER JOIN public."ETAPAS_PLAGA"
    ON public."CENSO_ETAPAPLAGA".id_etapa_plaga = public."ETAPAS_PLAGA".id_etapa_plaga;
    `;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}
var get_imagenes_censo = async (id) => {
  let sql = format(
    `SELECT * FROM public."IMAGEN_CENSO"
    WHERE id_censo = %L `,
    id
  );
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(sql);
  cliente_bd.release();
  return rta;
};

rutas.route("/censos").get(authorize(["admin", "user"]), (req, res) => {
  get_censos()
    .then((rta) => {
      if (!rta) {
        res.status(400).send({ message: "No se pudo obtener los censos." });
      } else {
        res.status(200).send(rta.rows);
      }
    })
    .catch((err) => {
      res.status(400).send({ message: `Algo inesperado ocurrió` });
      console.log(err);
    });
});
rutas
  .route("/censos/imagenes/:id")
  .get(authorize(["admin", "user"]), (req, res) => {
    get_imagenes_censo(req.params.id)
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo obtener las imagenes del censo" });
        } else {
          res.status(200).send(rta.rows);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: "Algo inesperado ocurrió" });
        console.log(err);
      });
  });

module.exports = rutas;
