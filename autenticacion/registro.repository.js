const config = require("../config");
const { Pool } = require("pg");
const BaseDatos = new Pool(config.connectionData);
const encriptar_clave = require("./util").encriptar_clave;

var consulta_registrar = async (req) => {
  let consulta = `INSERT INTO public."USUARIO"(
        cc_usuario, 
        nombre_usuario, 
        cargo_empresa, 
        contrasena_usuario,
        validado)
        VALUES ('${req.body.cc_usuario}',
            '${decodeURIComponent(req.body.nombre_usuario)}',
            '${decodeURIComponent(req.body.cargo_empresa)}',
            '${encriptar_clave(decodeURIComponent(req.body.contrasena_usuario))}',
            true);`;
  const cliente_bd = await BaseDatos.connect();
  let rta = await cliente_bd.query(consulta);
  cliente_bd.release();
  return rta;
};

module.exports = {
  consulta_registrar,
};
