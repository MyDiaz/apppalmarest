const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

//retorna el nombre de todos los lotes registrados en la base de datos
var get_lotes = async() => {
    let consulta = 'SELECT nombre_lote FROM "LOTE";';
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

//permite la creación de un lote
var post_lote = async(req) => {
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
}

//retorna los datos de un lote registrado en la base de datos
var get_lote = async(req) => {
    let consulta = `SELECT * FROM "LOTE" where nombre_lote ='${req.params.nombre}';`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

//Actualiza los datos de un lote en especifico
var put_lote = async(req) => {
    let consulta = `UPDATE "LOTE" SET 
    año_siembra='${req.body["año_siembra"]}', 
    hectareas='${req.body.hectareas}', 
    nombre_lote = '${decodeURIComponent(req.body.nombre_lote)}', 
    numero_palmas=${req.body.numero_palmas}, 
    material_siembra='${decodeURIComponent(req.body.material_siembra)}'  
    WHERE nombre_lote = '${req.params.nombre}';`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/lote')
    .get((req, res) => {
        get_lotes().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de lotes' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: `Algo inesperado ocurrió` });
                console.log(err);
            }
        )
    })
    .post((req, res) => {
        //pregunta si todos los campos requeridos están presentes 
        if (!req.body.nombre_lote || !req.body["año_siembra"] || !req.body.hectareas ||
            !req.body.numero_palmas || !req.body.material_siembra) {
            res.status(400).send({ message: 'Todos los campos son requeridos' });
        } else {
            post_lote(req).then(rta => {
                res.status(200).send({ message: "El lote se insertó correctamente" });
            }).catch(err => {
                console.log(err);
                var text;
                switch (err.constraint) {
                    case "hectareas_check":
                        text = "Las hectareas deben ser mayor a cero";
                        break;
                    case "numero_palmas_check":
                        text = "El número de palmas deben ser mayor a cero";
                        break;
                    case "año_siembra_check":
                        text = "El año siembra debe ser mayor a cero";
                        break;
                    case "material_siembra_check":
                        text = "El material de siembra no puede estar vacío";
                        break;
                    default:
                        text = "Error inesperado de base de datos";
                }
                res.status(400).send({ message: `${text}. No se pudo registrar el nuevo lote` });
            })
        }
    });

rutas.route('/lote/:nombre')
    .get((req, res) => {
        get_lote(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: "No se pudo obtener la información de este lote" });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió' });
                console.log(err);
            }
        )
    })
    .put((req, res) => {
        put_lote(req).then(rta => {
            res.status(200).send({
                respuesta: rta.rows,
                message: 'El lote se actualizó correctamente'
            });
        }).catch(err => {
            switch (err.constraint) {
                case "hectareas_check":
                    text = "Las hectáreas deben ser mayor a cero";
                    break;
                case "numero_palmas_check":
                    text = "El número de palmas deben ser mayor a cero";
                    break;
                case "año_siembra_check":
                    text = "El año siembra debe ser mayor a cero";
                    break;
                case "material_siembra_check":
                    text = "El material de siembra no puede estar vacío";
                    break;
                default:
                    text = "Error inesperado de base de datos";
            }
            res.status(400).send({ message: `${text}. No se pudo actualizar el lote` });
        });
    });

module.exports = rutas