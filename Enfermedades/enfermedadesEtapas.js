const express = require("express");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const {
  get_enfermedades_con_etapas,
  get_enfermedad_con_etapas,
  post_enfermedad_con_etapas,
  eliminar_enfermedad_con_etapas,
  actualizar_enfermedad_con_etapas,
} = require("./enfermedadesEtapas.repository");

rutas
  .route("/enfermedad-etapas")
  .get(authorize(["admin", "user"]), (req, res) => {
    get_enfermedades_con_etapas()
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo obtener el listado de enfermedades" });
        } else {
          res.status(200).send(rta.rows);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: "Algo inesperado ocurrió" });
      });
  })
  .post(authorize(["admin"]), (req, res) => {
    function estaVacio(elemento) {
      return elemento === "";
    }
    //si es TRUE es pq el array req.body.tratamiento_etapa_enfermedad tiene elementos
    const hay_tratamiento =
      req.body.tratamiento_etapa_enfermedad.findIndex(estaVacio) == -1;
    const hay_etapas = req.body.etapas_enfermedad.findIndex(estaVacio) == -1;
    /*console.log("hay_tratamiento",hay_tratamiento);
        console.log("hay_etapas",hay_etapas);
        console.log(req.body);
        console.log("etpas", req.body.etapas_enfermedad.length);
        console.log("trta", req.body.tratamiento_etapa_enfermedad.length);*/
    if (!req.body.nombre_enfermedad || !hay_tratamiento || !hay_etapas) {
      res.status(400).send({ message: "Ingrese todos los campos" });
    } else {
      post_enfermedad_con_etapas(req)
        .then((rta) => {
          //console.log("rta en post", rta);
          if (!rta) {
            res
              .status(400)
              .send({ message: "No se pudo insertar la enfermedad" });
          } else {
            res.status(200).send({ message: "Se agregó correctamente" });
          }
        })
        .catch((err) => {
          res.status(500).send({ message: "Algo inesperado ocurrió" });
          console.log(err);
        });
    }
  });

rutas
  .route("/enfermedad-etapas/:nombre_enfermedad")
  .get(authorize(["admin"]), (req, res) => {
    get_enfermedad_con_etapas(decodeURIComponent(req.params.nombre_enfermedad))
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo obtener el listado de enfermedades" });
        } else {
          res.status(200).send(rta);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: "Algo inesperado ocurrió" });
        console.log(err);
      });
  })
  .delete(authorize(["admin"]), (req, res) => {
    eliminar_enfermedad_con_etapas(
      decodeURIComponent(req.params["nombre_enfermedad"])
    )
      .then((rta) => {
        //console.log("req.params", req.params);
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo eliminar la enfermedad." });
        } else {
          res.status(200).send({ message: "Se eliminó la enfermedad." });
        }
      })
      .catch((err) => {
        console.log(err);
        //console.log("req.params", req.params);
        res.status(500).send({ message: "Algo inesperado ocurrió." });
      });
  })
  .put(authorize(["admin"]), (req, res) => {
    actualizar_enfermedad_con_etapas(req, res).then(() => res);
  });

module.exports = rutas;
