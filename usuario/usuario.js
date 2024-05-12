const express = require("express");
const config = require('../config');
const get_usuario = require('../autenticacion/util').get_usuario;
const encriptar_clave = require('../autenticacion/util').encriptar_clave;
const { authorize } = require("../autenticacion/util");
const bcrypt = require("bcryptjs");
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

var obtenerUsuarios = async(req) => {
    let consulta = `SELECT cc_usuario, nombre_usuario, cargo_empresa,rol, validado FROM public."USUARIO";`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

function scapePostgreSQL (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
            default:
                return char;
        }
    });
}

var cambiarValidacionUsuario = async(cc_usuario, validado) => {
    if (validado !== true && validado !== false) {
        throw new Error("'validado' debe ser un boolean!");
    }
    let consulta = `UPDATE public."USUARIO"
	SET validado = ${validado}
	WHERE cc_usuario = '${scapePostgreSQL(cc_usuario)}';`;
    console.log(consulta);

    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var actualizarDatosUsuario = async(req) => {
    //console.log("request en actualizar datos user", req)
    let consulta = `UPDATE public."USUARIO"
	SET
	cc_usuario = '${decodeURIComponent(req.body.cc_usuario)}', 
	nombre_usuario = '${decodeURIComponent(req.body.nombre_usuario)}', 
	${req.body.contrasena_usuario !== undefined ?
        `contrasena_usuario = '${encriptar_clave(decodeURIComponent(req.body.contrasena_usuario))}',` : ''}
    rol = '${decodeURIComponent(req.body.rol)}',
    cargo_empresa = '${decodeURIComponent(req.body.cargo_empresa)}'
    ${req.body.validado !== undefined ? `, validado = '${decodeURIComponent(req.body.validado)}'` : ''}
	WHERE cc_usuario = '${req.params.cc_usuario}';`;
    console.log(consulta);

    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/usuarios')
    .get(authorize(["admin", "user"]), (req, res) => {
        obtenerUsuarios().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de usuarios' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => { res.status(400).send({ message: 'Algo inesperado ocurrió en obtener el listado de usuarios' }); }
        )
    });

rutas.route('/usuarios/:cc_usuario')
    .get(authorize(["user", "admin"]), (req, res) => {
        get_usuario(req.params.cc_usuario).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario" });
            } else {
                res.json({
                    "cc_usuario": rta.cc_usuario,
                    "nombre_usuario": rta.nombre_usuario,
                    "cargo_empresa": rta.cargo_empresa,
                    "rol": rta.rol,
                    "validado": rta.validado
                })
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió.' });
            }
        )
    })
    .put(authorize(["admin"]), (req, res) => {
        get_usuario(req.params.cc_usuario).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario." });
            } else {
                actualizarDatosUsuario(req).then(rta => {
                    if (!rta) {
                        res.status(400).send({ message: "No se pudo actualizar la información de este usuario." });
                    } else {
                        res.status(200).send({
                            message: `El usuario se guardó exitosamente`
                        });
                    }
                }).catch(
                    err => {
                        res.status(400).send({ message: 'Algo inesperado ocurrió 1.' });
                        console.log("Error en actualizar usuario", err);
                    }
                )   
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió 2' });
                console.log("Error en obteniendo usuario", err);
            }
        )
    })
    .patch(authorize(["admin"]), (req, res) => {
        cambiarValidacionUsuario(req.params.cc_usuario, req.body.validado).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo cambiar validación de usuario." });
            } else {
                res.status(200).send(rta)
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió al intentar deshabilitar el usuario' });
                console.log("Error en cambiar validación de usuario", err);
            }
        )
    })

module.exports = rutas;