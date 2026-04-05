const express = require("express");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const {
  get_lotes,
  post_lote,
  get_lote,
  get_lote_mapa,
  update_mapa_lote,
  soft_delete_lote,
  put_lote,
} = require("./lote.repository");

rutas
  .route("/lote")
  .get(authorize(["admin", "user"]), (req, res) => {
    get_lotes()
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo obtener el listado de lotes." });
        } else {
          res.status(200).send(rta.rows);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: `Algo inesperado ocurrió.` });
        console.log(err);
      });
  })
  .post(authorize(["admin"]), (req, res) => {
    //pregunta si todos los campos requeridos están presentes
    if (
      !req.body.nombre_lote ||
      !req.body["año_siembra"] ||
      !req.body.hectareas ||
      !req.body.numero_palmas ||
      !req.body.material_siembra
    ) {
      res.status(400).send({ message: "Todos los campos son requeridos." });
    } else {
      post_lote(req)
        .then((rta) => {
          res.status(200).send({ message: "El lote se insertó correctamente." });
        })
        .catch((err) => {
          console.log(err);
          var text;
          switch (err.constraint) {
            case "hectareas_check":
              text = "Las hectáreas deben ser mayor a cero.";
              break;
            case "numero_palmas_check":
              text = "El número de palmas deben ser mayor a cero.";
              break;
            case "año_siembra_check":
              text = "El año siembra debe ser mayor a cero.";
              break;
            case "material_siembra_check":
              text = "El material de siembra no puede estar vacío.";
              break;
            default:
              text = "Error inesperado de base de datos.";
          }
          res
            .status(400)
            .send({ message: `${text}. No se pudo registrar el nuevo lote.` });
        });
    }
  });

rutas
  .route("/lote/:nombre")
  .get(authorize(["admin"]), (req, res) => {
    get_lote(req)
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({
              message: "No se pudo obtener la información de este lote.",
            });
        } else {
          res.status(200).send(rta.rows);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: "Algo inesperado ocurrió." });
        console.log(err);
      });
  })
  .put(authorize(["admin"]), (req, res) => {
    put_lote(req)
      .then((rta) => {
        res.status(200).send({
          respuesta: rta.rows,
          message: "El lote se actualizó correctamente.",
        });
      })
      .catch((err) => {
        console.log(err);
        switch (err.constraint) {
          case "hectareas_check":
            text = "Las hectáreas deben ser mayor a cero.";
            break;
          case "numero_palmas_check":
            text = "El número de palmas deben ser mayor a cero.";
            break;
          case "año_siembra_check":
            text = "El año siembra debe ser mayor a cero.";
            break;
          case "material_siembra_check":
            text = "El material de siembra no puede estar vacío.";
            break;
          default:
            text = "Error inesperado de base de datos.";
        }
        res
          .status(400)
          .send({ message: `${text}. No se pudo actualizar el lote.` });
      });
  })
  .delete(authorize(["admin"]), (req, res) => {
          soft_delete_lote(decodeURIComponent(req.params["nombre"])).then(rta => {
              //console.log("req.params", req.params);
              if (!rta) {
                  res.status(400).send({ message: 'No se pudo eliminar el lote.' });
              } else {
                  res.status(200).send({ message: 'Se eliminó el lote.' });
              }
          }).catch(err => {
              console.log(err);
              //console.log("req.params", req.params);
              res.status(500).send({ message: 'Algo inesperado ocurrió.' })
          })
      })

rutas
  .route("/lote/mapa/:nombre")
  .get((req, res) => {
    get_lote_mapa(req)
      .then((rta) => {
        if (!rta) {
          res.status(400).send({ message: "No se pudo obtener el mapa." });
        } else {
          res.set("Content-Type", "application/vnd.google-earth.kml+xml");
          res.header("Content-Type", "application/vnd.google-earth.kml+xml");
          res.status(200).send(rta);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: `Algo inesperado ocurrió.` });
        console.log(err);
      });
  })
  .put(authorize(["admin"]), (req, res) => {
    update_mapa_lote(req)
      .then((rta) => {
        res.status(200).send({
          respuesta: rta.rows,
          message: "El lote se actualizó correctamente.",
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send("No se pudo actualizar el lote.");
      });
  });

module.exports = rutas;
