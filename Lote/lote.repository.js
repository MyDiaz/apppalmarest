const config = require("../config");
const { Pool } = require("pg");
const BaseDatos = new Pool(config.connectionData);

var get_lotes = async () => {
  let consulta = 'SELECT * FROM "LOTE" where fue_borrado = false;';
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

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

var get_lote = async (req) => {
  let consulta = `SELECT * FROM "LOTE" where nombre_lote ='${req.params.nombre}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var get_lote_mapa = async (req) => {
  let consulta = `SELECT * FROM "LOTE" where nombre_lote ='${req.params.nombre}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  console.log(rta.rows);
  if (rta && rta.rows.length > 0) {
    return rta.rows[0].mapa;
  }
  return null;
};

var update_mapa_lote = async (req) => {
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

var soft_delete_lote = async (nombre_lote) => {
  let consulta = `UPDATE public."LOTE"
    SET fue_borrado = true
    WHERE nombre_lote = $1;`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta, [decodeURIComponent(nombre_lote)]);
  cliente_bd.release();
  return rta;
};

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

module.exports = {
  get_lotes,
  post_lote,
  get_lote,
  get_lote_mapa,
  update_mapa_lote,
  soft_delete_lote,
  put_lote,
};
