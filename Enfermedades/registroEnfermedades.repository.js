const config = require("../config");
const { Pool } = require("pg");
const format = require("pg-format");
const BaseDatos = new Pool(config.connectionData);

var get_registro_enfermedades = async () => {
  let consulta = `
    SELECT P.id_palma, "REGISTRO_ENFERMEDAD".nombre_enfermedad,"REGISTRO_ENFERMEDAD".id_registro_enfermedad,
    "ETAPAS_ENFERMEDAD".etapa_enfermedad, 
    P.nombre_lote,
    fecha_registro_enfermedad,
    observacion_registro_enfermedad
    FROM "REGISTRO_ENFERMEDAD"
    LEFT JOIN "ENFERMEDAD" ON "REGISTRO_ENFERMEDAD".nombre_enfermedad = "ENFERMEDAD".nombre_enfermedad
    LEFT JOIN "ETAPAS_ENFERMEDAD" ON "REGISTRO_ENFERMEDAD".id_etapa_enfermedad = "ETAPAS_ENFERMEDAD".id_etapa_enfermedad
    inner join "PALMA" as P
    on "REGISTRO_ENFERMEDAD".id_palma = P.id_palma;`;
  console.log(consulta);
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  console.log("get_registro_enfermedades", rta);
  return rta;
};

var get_imagenes_registro_enfermedad = async (id) => {
  let sql = format(
    `SELECT * FROM public."IMAGEN_REGISTRO_ENFERMEDAD"
    WHERE id_registro_enfermedad = %L `,
    id
  );
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(sql);
  cliente_bd.release();
  return rta;
};

var get_estado_fitosanitario_actual = async () => {
  let consulta_total_palmas = `
    SELECT
      nombre_lote,
      numero_palmas AS total_palmas
    FROM "LOTE"
    WHERE fue_borrado IS NOT TRUE
    ORDER BY nombre_lote;`;

  let consulta_palmas_activas = `
    SELECT
      P.nombre_lote,
      RE.id_palma,
      RE.nombre_enfermedad,
      COALESCE(EE.etapa_enfermedad, '') AS etapa_enfermedad,
      TO_CHAR(RE.fecha_registro_enfermedad, 'YYYY-MM-DD') AS fecha,
      CASE
        WHEN RE.id_etapa_enfermedad IS NOT NULL
          AND COALESCE(EE.causa_erradicacion_etapa, false) IS TRUE
          THEN 'pendiente_por_erradicar'
        WHEN RE.id_etapa_enfermedad IS NULL
          AND COALESCE(E.causa_erradicacion_enfermedad, false) IS TRUE
          THEN 'pendiente_por_erradicar'
        WHEN T.id_tratamiento IS NOT NULL THEN 'en_tratamiento'
        ELSE 'pendiente_por_tratar'
      END AS estado
    FROM (
      SELECT
        RE.id_registro_enfermedad,
        RE.id_palma,
        RE.nombre_enfermedad,
        RE.id_etapa_enfermedad,
        RE.fecha_registro_enfermedad,
        RE.hora_registro_enfermedad,
        RE.dada_de_alta
      FROM "REGISTRO_ENFERMEDAD" RE
      WHERE RE.dada_de_alta IS NOT TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM "ERRADICACION" ER
          WHERE ER.id_palma = RE.id_palma
        )
    ) RE
    INNER JOIN "PALMA" P
      ON P.id_palma = RE.id_palma
    LEFT JOIN "ENFERMEDAD" E
      ON E.nombre_enfermedad = RE.nombre_enfermedad
    LEFT JOIN "ETAPAS_ENFERMEDAD" EE
      ON EE.id_etapa_enfermedad = RE.id_etapa_enfermedad
    LEFT JOIN "TRATAMIENTO" T
      ON T.id_registro_enfermedad = RE.id_registro_enfermedad
    ORDER BY P.nombre_lote, RE.id_palma;`;

  const cliente_bd = await BaseDatos.connect();
  const total_palmas = await cliente_bd.query(consulta_total_palmas);
  const palmas_activas = await cliente_bd.query(consulta_palmas_activas);
  cliente_bd.release();

  return {
    total_palms_by_lote: total_palmas.rows,
    active_palms: palmas_activas.rows,
  };
};

var get_pend_por_tratar = async (id) => {
    let consulta = `SELECT 
        RE.id_registro_enfermedad,
        RE.fecha_registro_enfermedad,
        RE.nombre_enfermedad,
        EE.etapa_enfermedad,
        RE.id_etapa_enfermedad,
        T.id_tratamiento,
        RE.id_palma,
        P.nombre_lote,
        RE.dada_de_alta
    FROM "REGISTRO_ENFERMEDAD" RE
    FULL JOIN "TRATAMIENTO" T
        ON RE.id_registro_enfermedad = T.id_registro_enfermedad
    LEFT JOIN "ETAPAS_ENFERMEDAD" EE
        ON EE.id_etapa_enfermedad = RE.id_etapa_enfermedad
    inner join "PALMA" as P
		on P.id_palma = RE.id_palma
    where id_tratamiento IS NULL and RE.dada_de_alta is NOT true;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

module.exports = {
  get_registro_enfermedades,
  get_imagenes_registro_enfermedad,
  get_estado_fitosanitario_actual,
  get_pend_por_tratar,
};
