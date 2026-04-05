const config = require("../config");
const { Pool } = require("pg");
const BaseDatos = new Pool(config.connectionData);

var get_enfermedades = async () => {
  let consulta = `SELECT * FROM "ENFERMEDAD" where procedimiento_tratamiento_enfermedad != 'NULL' 
    and 
    fue_borrado = false;`;
  console.log(consulta);
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  console.log("get_enfermedades", rta);
  return rta;
};

var get_enfermedad = async (nombre_enfermedad) => {
  let consulta = `SELECT * FROM "ENFERMEDAD" where nombre_enfermedad = '${nombre_enfermedad}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta.rows;
};

var get_enfermedades_etapa_concat = async () => {
  let consulta = `SELECT concat(E.nombre_enfermedad,' ', EE.etapa_enfermedad)
    FROM "ENFERMEDAD" AS E
    LEFT JOIN "ETAPAS_ENFERMEDAD" AS EE
    ON E.nombre_enfermedad = EE.nombre_enfermedad
    where E.fue_borrado = false;`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta.rows;
};

var post_enfermedad = async (req) => {
  let enfermedad = await get_enfermedad(
    decodeURIComponent(req.body.nombre_enfermedad)
  );
  let consulta;
  const causa_erradicacion_enfermedad =
    req.body.causa_erradicacion_enfermedad === true ||
    req.body.causa_erradicacion_enfermedad === "true";
  if (enfermedad.length > 0) {
    if (!enfermedad[0].fue_borrado) {
      return;
    }
    consulta = `UPDATE public."ENFERMEDAD"
        SET procedimiento_tratamiento_enfermedad='${decodeURIComponent(
          req.body.procedimiento_tratamiento_enfermedad
        )}',
            causa_erradicacion_enfermedad=${causa_erradicacion_enfermedad},
            fue_borrado=false
        WHERE nombre_enfermedad = '${decodeURIComponent(
          req.body.nombre_enfermedad
        )}';`;
  } else {
    consulta = `INSERT INTO public."ENFERMEDAD"( nombre_enfermedad,
        "procedimiento_tratamiento_enfermedad",
        causa_erradicacion_enfermedad) VALUES 
        ( '${decodeURIComponent(
          req.body.nombre_enfermedad
        )}' , '${decodeURIComponent(
      req.body.procedimiento_tratamiento_enfermedad
    )}', ${causa_erradicacion_enfermedad} );`;
  }

  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var put_enfermedad = async (req) => {
  const causa_erradicacion_enfermedad =
    req.body.causa_erradicacion_enfermedad === true ||
    req.body.causa_erradicacion_enfermedad === "true";
  let consulta = `UPDATE public."ENFERMEDAD"
    SET nombre_enfermedad='${decodeURIComponent(
      req.body.nombre_enfermedad
    )}', procedimiento_tratamiento_enfermedad=
    '${decodeURIComponent(req.body.procedimiento_tratamiento_enfermedad)}',
    causa_erradicacion_enfermedad=${causa_erradicacion_enfermedad}
    WHERE nombre_enfermedad = '${decodeURIComponent(
      req.params.nombre_enfermedad
    )}';`;
  console.log(consulta);
  const cliente_bd = await BaseDatos.connect();
  await cliente_bd.query(consulta);
  cliente_bd.release();
  return true;
};

var eliminar_enfermedad = async (nombre_enfermedad) => {
  let consulta = `UPDATE public."ENFERMEDAD"
    SET fue_borrado = true
    WHERE nombre_enfermedad='${nombre_enfermedad}';
    UPDATE public."ETAPAS_ENFERMEDAD"
    SET fue_borrado = true
    WHERE nombre_enfermedad='${nombre_enfermedad}';`;
  console.log(consulta);
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

module.exports = {
  get_enfermedades,
  get_enfermedad,
  get_enfermedades_etapa_concat,
  post_enfermedad,
  put_enfermedad,
  eliminar_enfermedad,
};
