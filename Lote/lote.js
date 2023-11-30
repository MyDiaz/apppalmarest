const express = require("express");
const config = require("../config");
const { Pool } = require("pg");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);

//retorna el nombre de todos los lotes registrados en la base de datos
var get_lotes = async () => {
  let consulta = 'SELECT * FROM "LOTE";';
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

//permite la creación de un lote
var post_lote = async (req) => {
  let consulta = `INSERT INTO public."LOTE"("año_siembra", hectareas, nombre_lote, 
    numero_palmas, material_siembra) VALUES 
    (${req.body["año_siembra"]}, 
    ${req.body.hectareas}, 
    '${decodeURIComponent(req.body.nombre_lote)}', 
    ${req.body.numero_palmas},
    '${decodeURIComponent(req.body.material_siembra)}');`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

//retorna los datos de un lote registrado en la base de datos
var get_lote = async (req) => {
  let consulta = `SELECT * FROM "LOTE" where nombre_lote ='${req.params.nombre}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

//retorna el archivo xml del mapa
var get_lote_mapa = async (req) => {
  let consulta = `SELECT * FROM "LOTE" where nombre_lote ='${req.params.nombre}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  console.log(rta.rows);
  if (rta && rta.rows.length > 0) {
    return  rta.rows[0].mapa;
  } else {
    return null; // Return null if no result found
  }
};

var update_mapa_lote = async (req) => {
  // // Read the KML file as a Buffer
  const nombreLote = req.params.nombre;
  const xmlContent = req.file.buffer.toString("utf-8");
  console.log("Contenido del archivo XML recibido:", xmlContent);
  let consulta = `UPDATE "LOTE" SET 
    mapa = '${xmlContent}'
    WHERE nombre_lote = ${nombreLote}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

//Actualiza los datos de un lote en especifico
var put_lote = async (req) => {
  let consulta = `UPDATE "LOTE" SET 
    año_siembra= $1, 
    hectareas= $2, 
    nombre_lote = $3, 
    numero_palmas= $4, 
    material_siembra= $5,
    mapa = $6
    WHERE nombre_lote = '${req.params.nombre}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta, [
    req.body["año_siembra"],
    req.body.hectareas,
    decodeURIComponent(req.body.nombre_lote),
    req.body.numero_palmas,
    decodeURIComponent(req.body.material_siembra),
    decodeURIComponent(req.body.mapa),
  ]);
  cliente_bd.release();
  return rta;
};

rutas
  .route("/lote")
  .get(authorize(["admin", "user"]), (req, res) => {
    get_lotes()
      .then((rta) => {
        if (!rta) {
          res
            .status(400)
            .send({ message: "No se pudo obtener el listado de lotes" });
        } else {
          res.status(200).send(rta.rows);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: `Algo inesperado ocurrió` });
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
      res.status(400).send({ message: "Todos los campos son requeridos" });
    } else {
      post_lote(req)
        .then((rta) => {
          res.status(200).send({ message: "El lote se insertó correctamente" });
        })
        .catch((err) => {
          console.log(err);
          var text;
          switch (err.constraint) {
            case "hectareas_check":
              text = "Las hectareas deben ser mayor a cero";
              break;
            case "numero_palmas_check":
              text = "El número de palmas deben ser mayor a cero";
              break;
            case "año_siembra_check":
              text = "El año siembra debe ser mayor a cero";
              break;
            case "material_siembra_check":
              text = "El material de siembra no puede estar vacío";
              break;
            default:
              text = "Error inesperado de base de datos";
          }
          res
            .status(400)
            .send({ message: `${text}. No se pudo registrar el nuevo lote` });
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
              message: "No se pudo obtener la información de este lote",
            });
        } else {
          res.status(200).send(rta.rows);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: "Algo inesperado ocurrió" });
        console.log(err);
      });
  })
  .put(authorize(["admin"]), (req, res) => {
    put_lote(req)
      .then((rta) => {
        res.status(200).send({
          respuesta: rta.rows,
          message: "El lote se actualizó correctamente",
        });
      })
      .catch((err) => {
        console.log(err);
        switch (err.constraint) {
          case "hectareas_check":
            text = "Las hectáreas deben ser mayor a cero";
            break;
          case "numero_palmas_check":
            text = "El número de palmas deben ser mayor a cero";
            break;
          case "año_siembra_check":
            text = "El año siembra debe ser mayor a cero";
            break;
          case "material_siembra_check":
            text = "El material de siembra no puede estar vacío";
            break;
          default:
            text = "Error inesperado de base de datos";
        }
        res
          .status(400)
          .send({ message: `${text}. No se pudo actualizar el lote` });
      });
  });

rutas
  .route("/lote/mapa/:nombre")
  .get((req, res) => {
    get_lote_mapa(req)
      .then((rta) => {
        if (!rta) {
          res.status(400).send({ message: "No se pudo obtener el mapa" });
        } else {
          res.set("Content-Type", "application/vnd.google-earth.kml+xml");
          res.header("Content-Type", "application/vnd.google-earth.kml+xml");
          res.status(200).send(rta);
        }
      })
      .catch((err) => {
        res.status(400).send({ message: `Algo inesperado ocurrió` });
        console.log(err);
      });
  })
  .put(authorize(["admin"]), (req, res) => {
    update_mapa_lote(req)
      .then((rta) => {
        res.status(200).send({
          respuesta: rta.rows,
          message: "El lote se actualizó correctamente",
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send("No se pudo actualizar el lote");
      });
  });

module.exports = rutas;
