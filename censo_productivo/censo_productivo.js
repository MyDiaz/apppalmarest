const express = require("express");
const config = require("../config");
const { Pool } = require("pg");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require("pg-format");
const { StringDecoder } = require("node:string_decoder");

const BaseDatos = new Pool(config.connectionData);

//retorna todas los registro del censo productivo  de cada lote
var get_censo_productivo = async () => {
  let consulta = `
  SELECT cp.*, u.*
  FROM public."CENSO_PRODUCTIVO" cp
  INNER JOIN public."USUARIO" u ON cp.cc_usuario = u.cc_usuario;
`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var get_censo_productivo_lote = async (lote) => {
  const loteValue = lote; // this should come from params
  console.log(lote);
  const consulta = `
  SELECT cp.*, u.*
  FROM 
    public."CENSO_PRODUCTIVO" cp
  INNER JOIN 
    public."USUARIO" u ON cp.cc_usuario = u.cc_usuario
  WHERE 
    cp.nombre_lote = $1;`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta, [loteValue]);
  cliente_bd.release();
  return rta;
};

var postCensoProductivo = async (req) => {
  let censosIds = [];

  const cliente_bd = await BaseDatos.connect();
  const decoder = new StringDecoder("utf8");
  console.log("ptm");

  for (i in req.body.data) {
    let body = req.body.data[i];
    const {
      id_censo_productivo,
      fecha_registro_censo_productivo,
      nombre_lote,
      cantidad_palmas_leidas,
      cantidad_flores_femeninas,
      cantidad_flores_masculinas,
      cantidad_racimos_verdes,
      cantidad_racimos_pintones,
      cantidad_racimos_sobremaduros,
      cantidad_racimos_maduros,
      cc_usuario,
    } = body;
    const cent = Buffer.from(nombre_lote);
    var values = [];

    values.push([
      fecha_registro_censo_productivo,
      decoder.write(cent),
      cantidad_palmas_leidas,
      cantidad_flores_femeninas,
      cantidad_flores_masculinas,
      cantidad_racimos_verdes,
      cantidad_racimos_pintones,
      cantidad_racimos_sobremaduros,
      cantidad_racimos_maduros,
      cc_usuario,
    ]);

    if (!id_censo_productivo) {
      try {
        let sql = format(
          `INSERT INTO public."CENSO_PRODUCTIVO"(fecha_registro_censo_productivo, nombre_lote, cantidad_palmas_leidas, cantidad_flores_femeninas, cantidad_flores_masculinas, cantidad_racimos_verdes, cantidad_racimos_pintones, cantidad_racimos_sobremaduros, cantidad_racimos_maduros, cc_usuario) VALUES %L RETURNING id_censo_productivo`,
          values
        );
        // Se agrega el censo
        const censoResult = await cliente_bd.query(sql);
        const censoId = censoResult.rows[0].id_censo_productivo;
        censosIds.push(censoId);
      } catch (error) {
        console.log("Error en la consulta:", error);
        return { success: false };
      }
    } else {
      try {
        let sql = `UPDATE public."CENSO_PRODUCTIVO" SET fecha_registro_censo_productivo='${fecha_registro_censo_productivo}', cantidad_palmas_leidas=${cantidad_palmas_leidas}, cantidad_flores_femeninas=${cantidad_flores_femeninas}, cantidad_flores_masculinas=${cantidad_flores_masculinas}, cantidad_racimos_verdes=${cantidad_racimos_verdes}, cantidad_racimos_pintones=${cantidad_racimos_pintones}, cantidad_racimos_sobremaduros=${cantidad_racimos_sobremaduros}, cantidad_racimos_maduros=${cantidad_racimos_maduros} WHERE id_censo_productivo = ${id_censo_productivo}`;
        await cliente_bd.query(sql);
      } catch (error) {
        console.log("Error en la consulta:", error);
        return { success: false };
      }
    }
  }
  cliente_bd.release();

  return { success: true, censosIds: censosIds };
};
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
