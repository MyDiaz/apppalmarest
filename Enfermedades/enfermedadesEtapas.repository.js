const config = require("../config");
const { Pool } = require("pg");
const BaseDatos = new Pool(config.connectionData);
const { get_enfermedad } = require("./enfermedades.repository");

var get_enfermedades_con_etapas = async () => {
  let consulta = `select * from "ETAPAS_ENFERMEDAD"
    inner join
    "ENFERMEDAD" on 
	"ETAPAS_ENFERMEDAD".nombre_enfermedad = "ENFERMEDAD".nombre_enfermedad 
	where "ENFERMEDAD".fue_borrado = false and "ETAPAS_ENFERMEDAD".fue_borrado = false;`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var post_enfermedad_con_etapas = async (req) => {
  let values = "";
  let numero_etapas = req.body.etapas_enfermedad.length;
  if (numero_etapas) {
    return;
  }

  var enfermedad;
  let nombre_enfermedad_decode = decodeURIComponent(req.body.nombre_enfermedad);
  await get_enfermedad(nombre_enfermedad_decode)
    .then((rta) => {
      enfermedad = rta;
    })
    .catch((err) => {
      console.log(err);
    });
  if (enfermedad.length == 0) {
    let values = "";
    for (let i = 0; i < numero_etapas; i = i + 1) {
      values =
        values +
        `('${decodeURIComponent(
          req.body.etapas_enfermedad[i]
        )}','${nombre_enfermedad_decode}', 
            '${decodeURIComponent(
              req.body.tratamiento_etapa_enfermedad[i]
            )}'),`;
    }
    let consulta_enfermedad = `INSERT INTO public."ENFERMEDAD"(nombre_enfermedad) VALUES 
        ('${nombre_enfermedad_decode}');`;
    let consulta_etapas = `INSERT INTO public."ETAPAS_ENFERMEDAD" 
        (etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad)
        VALUES ${values}`;
    consulta_etapas = consulta_etapas.slice(0, -1) + ";";
    let consulta = `${consulta_enfermedad} ${consulta_etapas}`;
    const cliente_bd = await BaseDatos.connect();
    var resp = await cliente_bd.query(consulta);
    cliente_bd.release();
    return resp;
  } else if (enfermedad[0].fue_borrado) {
    for (let i = 0; i < numero_etapas; i = i + 1) {
      values =
        values +
        `('${decodeURIComponent(
          req.body.etapas_enfermedad[i]
        )}','${nombre_enfermedad_decode}', 
            '${decodeURIComponent(
              req.body.tratamiento_etapa_enfermedad[i]
            )}'),`;
    }
    let consulta_enfermedad = `UPDATE public."ENFERMEDAD"
        SET fue_borrado = false,
            procedimiento_tratamiento_enfermedad = NULL
        WHERE nombre_enfermedad = ('${nombre_enfermedad_decode}');`;
    let consulta_etapas = `INSERT INTO public."ETAPAS_ENFERMEDAD" 
        (etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad)
        VALUES ${values}`;
    consulta_etapas = consulta_etapas.slice(0, -1) + ";";
    let consulta = `${consulta_enfermedad} ${consulta_etapas}`;
    const cliente_bd = await BaseDatos.connect();
    var rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
  }
};

var get_enfermedad_con_etapas = async (nombre_enfermedad) => {
  let consulta = `SELECT * FROM "ETAPAS_ENFERMEDAD" where nombre_enfermedad = '${nombre_enfermedad}'
    and fue_borrado = false;`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta.rows;
};

var post_etapa_enfermedad = async (
  etapa_enfermedad,
  nombre_enfermedad,
  tratamiento_etapa_enfermedad
) => {
  let consulta = `INSERT INTO public."ETAPAS_ENFERMEDAD"(
        etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad)
        VALUES ('${decodeURIComponent(etapa_enfermedad)}', 
        '${decodeURIComponent(nombre_enfermedad)}', '${decodeURIComponent(
    tratamiento_etapa_enfermedad
  )}');`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var actualizar_etapa_enfermedad = async (
  id_etapa_enfermedad,
  etapa_enfermedad,
  tratamiento_etapa_enfermedad
) => {
  let consulta = `UPDATE public."ETAPAS_ENFERMEDAD"
	SET etapa_enfermedad='${etapa_enfermedad}', tratamiento_etapa_enfermedad='${tratamiento_etapa_enfermedad}'
    WHERE id_etapa_enfermedad=${id_etapa_enfermedad};`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var eliminar_etapa_enfermedad = async (id_etapa_enfermedad) => {
  let consulta = `update public."ETAPAS_ENFERMEDAD" set fue_borrado = true
  where id_etapa_enfermedad = '${id_etapa_enfermedad}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var actualizar_nombre_enfermedad = async (
  nombre_enfermedad_nuevo,
  nombre_enfermedad_viejo
) => {
  let consulta = `UPDATE public."ENFERMEDAD"
	SET nombre_enfermedad='${decodeURIComponent(nombre_enfermedad_nuevo)}'
    WHERE nombre_enfermedad='${nombre_enfermedad_viejo}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var eliminar_enfermedad_con_etapas = async (nombre_enfermedad) => {
  let consulta = `UPDATE public."ENFERMEDAD"
    SET fue_borrado = true
    WHERE nombre_enfermedad='${nombre_enfermedad}';
    UPDATE public."ETAPAS_ENFERMEDAD"
    SET fue_borrado = true
    WHERE nombre_enfermedad='${nombre_enfermedad}';`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

var actualizar_enfermedad_con_etapas = async (req, res) => {
  function estaVacio(elemento) {
    return elemento === "";
  }

  algo_tratamiento =
    req.body.tratamientos_etapa_enfermedad.findIndex(estaVacio) == -1;
  algo_etapas = req.body.etapas_enfermedad.findIndex(estaVacio) == -1;
  if (
    !req.params.nombre_enfermedad ||
    !algo_tratamiento ||
    !algo_etapas ||
    !req.body.tratamientos_etapa_enfermedad ||
    req.body.tratamientos_etapa_enfermedad.length == 0
  ) {
    res.status(400).send({ message: "Ingrese todos los campos" });
  } else {
    try {
      rta = await get_enfermedad_con_etapas(req.params.nombre_enfermedad);
    } catch (err) {
      console.log(err);
      res.status(500).send({
        message: `Algo inesperado ocurriÃ³ obteniendo la enfermedad ${req.params["nombre_enfermedad"]}.`,
      });
    }

    let ids_viejos = rta.map((etapa) => {
      return etapa.id_etapa_enfermedad;
    });
    let ids_nuevos = req.body.ids_etapas_enfermedad;
    let tratamientos = req.body.tratamientos_etapa_enfermedad.map(
      (tratamiento) => {
        return decodeURIComponent(tratamiento);
      }
    );
    let etapas = req.body.etapas_enfermedad.map((etapa) => {
      return decodeURIComponent(etapa);
    });

    for (let i = 0; i < ids_nuevos.length; i++) {
      if (ids_nuevos[i] == -1) {
        try {
          rta = await post_etapa_enfermedad(
            etapas[i],
            req.params["nombre_enfermedad"],
            tratamientos[i]
          );
          if (!rta) {
            res.status(400).send({
              message: `No se pudo insertar la etapa de la enfermedad ${req.params["nombre_enfermedad"]}`,
            });
          }
        } catch (err) {
          res.status(500).send({
            message: `Algo inesperado ocurriÃ³ tratando de agregar una nueva etapa en la ${req.params["nombre_enfermedad"]}`,
          });
          console.log(err);
        }
      } else {
        try {
          rta = await actualizar_etapa_enfermedad(
            ids_nuevos[i],
            etapas[i],
            tratamientos[i]
          );
          if (!rta) {
            res.status(400).send({
              message: `No se pudo actualizar la etapa de la enfermedad ${req.params["nombre_enfermedad"]}`,
            });
          }
        } catch (err) {
          res.status(500).send({
            message: `Algo inesperado ocurriÃ³ actualizando la etapa de la enfermedad ${req.params["nombre_enfermedad"]}`,
          });
          console.log(err);
        }
      }
    }
    for (let i = 0; i < ids_viejos.length; i++) {
      if (!ids_nuevos.includes(ids_viejos[i])) {
        try {
          rta = await eliminar_etapa_enfermedad(ids_viejos[i]);
          if (!rta) {
            res.status(400).send({
              message: `No se pudo eliminar la etapa de la enfermedad ${req.params["nombre_enfermedad"]}.`,
            });
          }
        } catch (err) {
          res.status(500).send({
            message: `Algo inesperado ocurriÃ³ eliminando la etapa de la enfermedad ${req.params["nombre_enfermedad"]}.`,
          });
          console.log(err);
        }
      }
    }
    try {
      if (req.body.nombre_enfermedad != req.params["nombre_enfermedad"]) {
        rta = await actualizar_nombre_enfermedad(
          req.body.nombre_enfermedad,
          req.params["nombre_enfermedad"]
        );
        if (!rta) {
          res.status(400).send({
            message: `No se pudo editar el nombre de la enfermedad ${req.params["nombre_enfermedad"]}.`,
          });
        }
      }
    } catch (err) {
      res.status(500).send({
        message: `Algo inesperado ocurriÃ³ cambiando el nombre de: ${req.params["nombre_enfermedad"]}.`,
      });
      console.log(err);
    }
    res.status(200).send({ message: `Se editÃ³ correctamente la enfermedad.` });
  }
};

module.exports = {
  get_enfermedades_con_etapas,
  post_enfermedad_con_etapas,
  actualizar_enfermedad_con_etapas,
  eliminar_enfermedad_con_etapas,
  eliminar_etapa_enfermedad,
  post_etapa_enfermedad,
  actualizar_etapa_enfermedad,
  actualizar_nombre_enfermedad,
};
