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

const normalizarMesInforme = ({ fecha, mes } = {}) => {
  const mesFuente = fecha ? String(fecha).slice(0, 7) : mes;
  const mesNormalizado = mesFuente || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-\d{2}$/.test(mesNormalizado)) {
    throw new Error("Formato de mes invalido");
  }

  const [anio, numeroMes] = mesNormalizado.split("-").map(Number);
  if (numeroMes < 1 || numeroMes > 12) {
    throw new Error("Formato de mes invalido");
  }

  const inicioMes = new Date(Date.UTC(anio, numeroMes - 1, 1, 0, 0, 0, 0));
  const finMes = new Date(Date.UTC(anio, numeroMes, 0, 23, 59, 59, 999));

  return { inicioMes, finMes };
};

const crearFiltroInforme = ({ lote, enfermedad } = {}, aliasRegistro = "RE", aliasPalma = "P") => {
  const values = [];
  const conditions = [];

  if (lote && lote !== "Todos") {
    values.push(lote);
    conditions.push(`${aliasPalma}.nombre_lote = $${values.length}`);
  }

  if (enfermedad && enfermedad !== "Todas") {
    values.push(enfermedad);
    conditions.push(`${aliasRegistro}.nombre_enfermedad = $${values.length}`);
  }

  return { values, conditions };
};

const agregarParametrosFecha = (values, fechas) => {
  const inicioIndex = values.push(fechas.inicioMes);
  const finIndex = values.push(fechas.finMes);
  return { inicio: `$${inicioIndex}`, fin: `$${finIndex}` };
};

const redondearPorcentaje = (valor) => Math.round(Number(valor || 0) * 100) / 100;

var get_informe_mensual = async (filtros = {}) => {
  const fechas = normalizarMesInforme(filtros);
  const filtroComun = crearFiltroInforme(filtros);
  const filtroLote = crearFiltroInforme({ lote: filtros.lote });

  const condicionesComun = filtroComun.conditions.length ? `AND ${filtroComun.conditions.join(" AND ")}` : "";
  const condicionesLote = filtroLote.conditions.length ? `AND ${filtroLote.conditions.join(" AND ")}` : "";

  const valuesTotalPalmas = [...filtroLote.values];
  const consultaTotalPalmas = `
    SELECT COALESCE(SUM(P.numero_palmas), 0)::int AS total_palmas
    FROM "LOTE" P
    WHERE P.fue_borrado IS NOT TRUE
      ${condicionesLote};`;

  const valuesCasosMes = [...filtroComun.values];
  const fechasCasosMes = agregarParametrosFecha(valuesCasosMes, fechas);
  const consultaCasosMes = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    WHERE RE.fecha_registro_enfermedad BETWEEN ${fechasCasosMes.inicio} AND ${fechasCasosMes.fin}
      ${condicionesComun};`;

  const valuesRegistrosMes = [...filtroComun.values];
  const fechasRegistrosMes = agregarParametrosFecha(valuesRegistrosMes, fechas);
  const consultaRegistrosMes = `
    SELECT P.id_palma, RE.nombre_enfermedad, RE.id_registro_enfermedad,
      EE.etapa_enfermedad,
      P.nombre_lote,
      RE.fecha_registro_enfermedad,
      RE.observacion_registro_enfermedad
    FROM "REGISTRO_ENFERMEDAD" RE
    LEFT JOIN "ENFERMEDAD" E
      ON RE.nombre_enfermedad = E.nombre_enfermedad
    LEFT JOIN "ETAPAS_ENFERMEDAD" EE
      ON RE.id_etapa_enfermedad = EE.id_etapa_enfermedad
    INNER JOIN "PALMA" P
      ON RE.id_palma = P.id_palma
    WHERE RE.fecha_registro_enfermedad BETWEEN ${fechasRegistrosMes.inicio} AND ${fechasRegistrosMes.fin}
      ${condicionesComun}
    ORDER BY RE.fecha_registro_enfermedad, RE.id_registro_enfermedad;`;

  const condicionActivo = `
    COALESCE(RE.dada_de_alta, false) = false
    AND NOT EXISTS (
      SELECT 1
      FROM "ERRADICACION" ER
      WHERE ER.id_palma = RE.id_palma
        AND ER.fecha_erradicacion <= $1
    )`;

  const condicionPendientePorErradicar = `
    (
      RE.id_etapa_enfermedad IS NOT NULL
      AND COALESCE(EE.causa_erradicacion_etapa, false) IS TRUE
    )
    OR (
      RE.id_etapa_enfermedad IS NULL
      AND COALESCE(E.causa_erradicacion_enfermedad, false) IS TRUE
    )`;

  const joinsClasificacion = `
    LEFT JOIN "ENFERMEDAD" E
      ON E.nombre_enfermedad = RE.nombre_enfermedad
    LEFT JOIN "ETAPAS_ENFERMEDAD" EE
      ON EE.id_etapa_enfermedad = RE.id_etapa_enfermedad`;

  const valuesAcumulados = [fechas.finMes, ...filtroComun.values];
  const condicionesComunAcumulado = filtroComun.conditions
    .map((condition) => condition.replace(/\$(\d+)/g, (_, index) => `$${Number(index) + 1}`))
    .join(" AND ");
  const consultaAcumulados = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    ${joinsClasificacion}
    WHERE RE.fecha_registro_enfermedad <= $1
      AND ${condicionActivo}
      ${condicionesComunAcumulado ? `AND ${condicionesComunAcumulado}` : ""};`;

  const consultaPendientesErradicar = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    ${joinsClasificacion}
    WHERE RE.fecha_registro_enfermedad <= $1
      AND ${condicionActivo}
      AND (${condicionPendientePorErradicar})
      ${condicionesComunAcumulado ? `AND ${condicionesComunAcumulado}` : ""};`;

  const consultaPendientes = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    ${joinsClasificacion}
    WHERE RE.fecha_registro_enfermedad <= $1
      AND ${condicionActivo}
      AND NOT (${condicionPendientePorErradicar})
      AND NOT EXISTS (
        SELECT 1
        FROM "TRATAMIENTO" T
        WHERE T.id_registro_enfermedad = RE.id_registro_enfermedad
          AND T.fecha_tratamiento <= $1
      )
      ${condicionesComunAcumulado ? `AND ${condicionesComunAcumulado}` : ""};`;

  const consultaRecuperacion = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    ${joinsClasificacion}
    WHERE RE.fecha_registro_enfermedad <= $1
      AND ${condicionActivo}
      AND NOT (${condicionPendientePorErradicar})
      AND EXISTS (
        SELECT 1
        FROM "TRATAMIENTO" T
        WHERE T.id_registro_enfermedad = RE.id_registro_enfermedad
          AND T.fecha_tratamiento <= $1
      )
      ${condicionesComunAcumulado ? `AND ${condicionesComunAcumulado}` : ""};`;

  // ERRADICACION no tiene relacion directa con enfermedad en este esquema.
  const valuesEliminada = [...filtroLote.values];
  const fechasEliminada = agregarParametrosFecha(valuesEliminada, fechas);
  const condicionesEliminada = filtroLote.conditions.length ? `AND ${filtroLote.conditions.join(" AND ")}` : "";
  const consultaEliminada = `
    SELECT COUNT(*)::int AS total
    FROM "ERRADICACION" ER
    INNER JOIN "PALMA" P ON P.id_palma = ER.id_palma
    WHERE ER.fecha_erradicacion BETWEEN ${fechasEliminada.inicio} AND ${fechasEliminada.fin}
      ${condicionesEliminada};`;

  const valuesAlta = [...filtroComun.values];
  const fechasAlta = agregarParametrosFecha(valuesAlta, fechas);
  const consultaAlta = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    WHERE RE.dada_de_alta IS TRUE
      AND EXISTS (
        SELECT 1
        FROM "TRATAMIENTO" T
        WHERE T.id_registro_enfermedad = RE.id_registro_enfermedad
          AND T.fecha_tratamiento BETWEEN ${fechasAlta.inicio} AND ${fechasAlta.fin}
      )
      ${condicionesComun};`;

  const valuesReincidencia = [...filtroComun.values];
  const fechasReincidencia = agregarParametrosFecha(valuesReincidencia, fechas);
  const consultaReincidencia = `
    SELECT COUNT(*)::int AS total
    FROM "REGISTRO_ENFERMEDAD" RE
    INNER JOIN "PALMA" P ON P.id_palma = RE.id_palma
    WHERE RE.fecha_registro_enfermedad BETWEEN ${fechasReincidencia.inicio} AND ${fechasReincidencia.fin}
      AND EXISTS (
        SELECT 1
        FROM "REGISTRO_ENFERMEDAD" PREV
        WHERE PREV.id_palma = RE.id_palma
          AND PREV.nombre_enfermedad = RE.nombre_enfermedad
          AND PREV.fecha_registro_enfermedad < RE.fecha_registro_enfermedad
      )
      ${condicionesComun};`;

  const cliente_bd = await BaseDatos.connect();
  try {
    const [
      totalPalmasRta,
      casosMesRta,
      acumuladosRta,
      pendientesErradicarRta,
      pendientesRta,
      recuperacionRta,
      eliminadaRta,
      altaRta,
      reincidenciaRta,
      registrosMesRta,
    ] = await Promise.all([
      cliente_bd.query(consultaTotalPalmas, valuesTotalPalmas),
      cliente_bd.query(consultaCasosMes, valuesCasosMes),
      cliente_bd.query(consultaAcumulados, valuesAcumulados),
      cliente_bd.query(consultaPendientesErradicar, valuesAcumulados),
      cliente_bd.query(consultaPendientes, valuesAcumulados),
      cliente_bd.query(consultaRecuperacion, valuesAcumulados),
      cliente_bd.query(consultaEliminada, valuesEliminada),
      cliente_bd.query(consultaAlta, valuesAlta),
      cliente_bd.query(consultaReincidencia, valuesReincidencia),
      cliente_bd.query(consultaRegistrosMes, valuesRegistrosMes),
    ]);

    const totalPalmas = Number(totalPalmasRta.rows[0]?.total_palmas || 0);
    const totalCasosMes = Number(casosMesRta.rows[0]?.total || 0);
    const totalCasosAcumulados = Number(acumuladosRta.rows[0]?.total || 0);
    const pendientesPorErradicar = Number(pendientesErradicarRta.rows[0]?.total || 0);
    const pendientesPorTratar = Number(pendientesRta.rows[0]?.total || 0);
    const enRecuperacion = Number(recuperacionRta.rows[0]?.total || 0);
    const eliminada = Number(eliminadaRta.rows[0]?.total || 0);
    const deAlta = Number(altaRta.rows[0]?.total || 0);
    const reincidencia = Number(reincidenciaRta.rows[0]?.total || 0);

    return {
      total_casos_mes: totalCasosMes,
      total_casos_acumulados: totalCasosAcumulados,
      incidencia_real: totalPalmas > 0
        ? redondearPorcentaje(((pendientesPorTratar + enRecuperacion) / totalPalmas) * 100)
        : 0,
      incidencia_acumulada: totalPalmas > 0
        ? redondearPorcentaje((totalCasosAcumulados / totalPalmas) * 100)
        : 0,
      evolucion: {
        pendientes_por_tratar: pendientesPorTratar,
        en_recuperacion: enRecuperacion,
        pendientes_por_erradicar: pendientesPorErradicar,
        reincidencia,
        de_alta: deAlta,
        eliminada,
      },
      registros: registrosMesRta.rows,
    };
  } finally {
    cliente_bd.release();
  }
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
  get_informe_mensual,
  get_pend_por_tratar,
};
