const express = require("express");
const config = require('../config');
const get_usuario = require('../autenticacion/util').get_usuario;
const encriptar_clave = require('../autenticacion/util').encriptar_clave;
const { authorize } = require("../autenticacion/util");
const bcrypt = require("bcryptjs");
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

var obtenerUsuarios = async() => {
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
    cargo_empresa = '${decodeURIComponent(req.body.cargo_empresa)}',
    telefono = '${decodeURIComponent(req.body.telefono)}'
    ${req.body.correo === undefined ? '' : `, correo = '${req.body.correo}'`}
    ${req.body.validado !== undefined ? `, validado = '${decodeURIComponent(req.body.validado)}'` : ''}
	WHERE cc_usuario = '${req.params.cc_usuario}';`;

    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var actualizarDatosPropios = async(cc_usuario, nombre, telefono, correo) => {
    let consulta = `UPDATE public."USUARIO"
	SET
        nombre_usuario = '${decodeURIComponent(nombre)}',
        telefono = '${decodeURIComponent(telefono)}',
        correo = '${correo}'
	WHERE cc_usuario = '${cc_usuario}';`;

    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var actualizarContrasenaUsuario = async(cc_usuario, contrasenaNueva) => {

    let consulta = `UPDATE public."USUARIO"
	SET contrasena_usuario = '${encriptar_clave(contrasenaNueva)}'
	WHERE cc_usuario = '${cc_usuario}';`;
    console.log(consulta);

    const cliente_bd = await BaseDatos.connect();
    await cliente_bd.query(consulta);
    cliente_bd.release();
    return "La contraseña se cambió correctamente";
}

const containsUppercase = ".*[A-Z].*";
const containsLowercase = ".*[a-z].*";
const containsDigit = ".*[0-9].*";
const containsSpecial = ".*[,;_\\-'#$%&/()=?¡¿!].*";
const containsOnlyValid = "^[a-zA-Z0-9,;_\\-'#$%&/()=?¡¿!]+$";

const validarContrasena = (contrasena) => {
    if (contrasena.length < 8) {
        return "La contraseña debe tener al menos 8 caracteres";
    }

    console.log(!contrasena.match(containsDigit), !contrasena.match(containsUppercase), !contrasena.match(containsLowercase),
        !contrasena.match(containsSpecial));

    if (!contrasena.match(containsDigit) || !contrasena.match(containsUppercase) || !contrasena.match(containsLowercase)
        || !contrasena.match(containsSpecial)) {
        return "La contraseña debe contener al menos una mayúscula, una minúscula, un dígito y un caracter especial (,;_\-'#$%&/()=?¡¿!)";
    }
    if (!contrasena.match(containsOnlyValid)) {
        return "La contraseña contiene caracteres inválidos";
    }
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
            () => { res.status(400).send({ message: 'Algo inesperado ocurrió en obtener el listado de usuarios' }); }
        )
    });

/**
 * Le permite a un usuario cambiar los datos de su perfil:
 * - correo
 * - teléfono
 * - nombre
 */
rutas.route('/self/profile')
    .put(authorize(["user", "admin"]), (req, res) => {
	    const nombre_usuario = req.body.nombre_usuario;
        const telefono = decodeURIComponent(req.body.telefono);
        const correo = req.body.correo;
        if (!nombre_usuario) {
            res.status(400).send({
                message: "Se debe proporcionar un nombre completo"
            });
            return;
        }
        if (!telefono) {
            res.status(400).send({
                message: "Se debe proporcionar un telefono"
            });
            return;
        }
        if (!correo) {
            res.status(400).send({
                message: "Se debe proporcionar un correo"
            });
            return;
        }
        const cc_usuario = req.account.sub.cc_usuario;
        actualizarDatosPropios(cc_usuario, nombre_usuario, telefono, correo).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario" });
            } else {
                get_usuario(cc_usuario).then(rta =>
                    res.status(200).send({
                        cc_usuario: rta.cc_usuario,
                        nombre_usuario: rta.nombre_usuario,
                        cargo_empresa: rta.cargo_empresa,
                        rol: rta.rol,
                        validado: rta.validado,
                        telefono: rta.telefono,
                        correo: rta.correo
                    })
                )
            }
        });
    });

/**
 * Le permite a un usuario cambiar su contraseña.
 */
rutas.route('/self/password')
    .put(authorize(["user", "admin"]), (req, res) => {
        const contrasena_actual = req.body.contrasena_actual;
        const contrasena_nueva = req.body.contrasena_nueva;
        console.log(contrasena_actual);
        console.log(contrasena_nueva);
        if (!contrasena_actual) {
            res.status(400).json({
                message: "La contraseña actual no puede ser vacía"
            });
            return;
        }
        if (!contrasena_nueva) {
            res.status(400).json({
                message: "La contraseña nueva no puede ser nula"
            });
            return;
        }
        const error = validarContrasena(contrasena_nueva);
        if (error) {
            res.status(400).json({
                message: error
            });
            return;
        }
        const cc_usuario = req.account.sub.cc_usuario;
        get_usuario(cc_usuario).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario" });
            } else {
                console.log(rta);
                bcrypt.compare(decodeURIComponent(contrasena_actual), rta.contrasena_usuario, (err, isValid) => {
                    if (err) {
                        res.status(501).send({ message: "Error inesperado" });
                        console.log(err);
                        return;
                    }
                    if (!isValid) {
                        res.status(400).send({
                            message: "La contraseña actual ingresada no es correca"
                        });
                        return;
                    }
                    actualizarContrasenaUsuario(cc_usuario, contrasena_nueva).then(message =>
                        res.status(200).send({message})
                    );
                });
            }
        })
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
                    "telefono": rta.telefono,
                    "correo": rta.correo,
                    "rol": rta.rol,
                    "validado": rta.validado
                })
            }
        }).catch(
            () => {
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
                        res.status(400).send({
                            message: "No se pudo actualizar la información de este usuario."
                        });
                    } else {
                        res.status(200).send({
                            message: `El usuario se guardó exitosamente`
                        });
                    }
                }).catch(
                    err => {
                        console.log("Error al actualizar usuario", err);
                        res.status(400).send({ message: 'Error al actualizar usuario.' });
                    }
                )   
            }
        }).catch(
            err => {
                console.log("Error en obteniendo usuario", err);
                res.status(400).send({ message: 'Algo inesperado ocurrió.' });
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
                console.log("Error en cambiar validación de usuario", err);
                res.status(400).send({ message: 'Algo inesperado ocurrió al intentar deshabilitar el usuario' });
            }
        )
    })

module.exports = rutas;