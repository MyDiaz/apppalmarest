const express = require("express");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const {
  get_censo_productivo,
  get_censo_productivo_lote,
  get_censo_min_year,
  postCensoProductivo,
} = require("./censo_productivo.repository");

rutas
  .route("/censo-productivo")
  .post(authorize(["admin", "user"]), (req, res) => {
    postCensoProductivo(req)
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo insertar el censo productivo" });
        } else {
          res.status(200).send(rta);
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({ message: "Algo inesperado ocurrió" });
      });
  })
  .get(authorize(["admin", "user"]), (req, res) => {
    get_censo_productivo()
      .then((rta) => {
        if (!rta) {
          res.status(400).send({
            message: "No se pudo obtener los registros de censo productivo.",
          });
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
  .route("/censo-productivo/min_year")
  .get(authorize(["admin", "user"]), (req, res) => {
    get_censo_min_year()
      .then((rta) => {
        if (!rta) {
          res.status(200).send({
            min_year: 2000,
          });
        } else {
          res.status(200).send({
            min_year: rta,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ message: `Algo inesperado ocurrió` });
        console.log(err);
      });
  });

rutas
  .route("/censo-productivo/:lote")
  .get(authorize(["admin", "user"]), (req, res) => {
    get_censo_productivo_lote(req.params.lote)
      .then((rta) => {
        if (!rta) {
          res.status(400).send({
            message: "No se pudo obtener los registros de censo productivo.",
          });
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
