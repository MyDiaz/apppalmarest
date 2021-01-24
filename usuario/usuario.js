const express = require("express");
const config = require('../config');
const get_usuario = require('../autenticacion/util').get_usuario;
const encriptar_clave = require('../autenticacion/util').encriptar_clave;
const bcrypt = require("bcryptjs");
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);


var actualizarUsuario = async(req) => {
    let consulta = `UPDATE public."USUARIO"
	SET
	nombre_usuario = '${decodeURIComponent(req.body.nombre_usuario)}', 
	contrasena_usuario = '${encriptar_clave(decodeURIComponent(req.body.nueva_contrasena))}'
	WHERE cc_usuario = '${req.params.cc_usuario}';`;
    console.log(consulta);

    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/usuario/:cc_usuario')
    .get((req, res) => {
        get_usuario(req.params.cc_usuario).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario" });
            } else {
                res.status(200).send(rta);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió.' });
            }
        )
    })
    .put((req, res) => {
        get_usuario(req.params.cc_usuario).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este usuario." });
            } else {
                let contrasenaValida = bcrypt.compareSync(decodeURIComponent(req.body.contrasena_antigua), rta.contrasena_usuario);
                console.log(rta.contrasena_usuario, ",", encriptar_clave(decodeURIComponent(req.body.contrasena_antigua)));
                console.log("12345678", encriptar_clave("12345678"));
                if (contrasenaValida) {
                    actualizarUsuario(req).then(rta => {
                        if (!rta) {
                            res.status(400).send({ message: "No se pudo actualizar la información de este usuario." });
                        } else {
                            res.status(200).send(rta);
                        }
                    }).catch(
                        err => {
                            res.status(400).send({ message: 'Algo inesperado ocurrió.' });
                            console.log("Error en actualizar usuario", err);
                        }
                    )
                } else {
                    res.status(400).send({ message: 'Las contraseñas no coinciden.' });
                }
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió' });
                console.log("Error en obteniendo usuario", err);
            }
        )
    })

module.exports = rutas;