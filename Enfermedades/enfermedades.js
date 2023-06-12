const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");

const BaseDatos = new Pool(config.connectionData);


var get_enfermedades = async() => {
    let consulta = `SELECT * FROM "ENFERMEDAD" where procedimiento_tratamiento_enfermedad != 'NULL' 
    and 
    fue_borrado = false;`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    console.log("get_enfermedades", rta);
    return rta;
}

var get_enfermedad = async(nombre_enfermedad) => {
    let consulta = `SELECT * FROM "ENFERMEDAD" where nombre_enfermedad = '${nombre_enfermedad}';`;
    //console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta.rows;
}

//query que trae el nombre de la enfermedad y su etapa correspondiente concatenada
var get_enfermedades_etapa_concat = async(nombre_enfermedad) => {
    let consulta = `SELECT concat(E.nombre_enfermedad,' ', EE.etapa_enfermedad)
    FROM "ENFERMEDAD" AS E
    LEFT JOIN "ETAPAS_ENFERMEDAD" AS EE
    ON E.nombre_enfermedad = EE.nombre_enfermedad
    where E.fue_borrado = false;`;
    //console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta.rows;
}

var post_enfermedad = async(req) => {
    let consulta = `INSERT INTO public."ENFERMEDAD"( nombre_enfermedad,
    "procedimiento_tratamiento_enfermedad") VALUES 
    ( '${decodeURIComponent(req.body.nombre_enfermedad)}' , '${decodeURIComponent(req.body.procedimiento_tratamiento_enfermedad)}' );`
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

//req.params.nombre_enfermedad
var put_enfermedad = async(req) => {
    let consulta = `UPDATE public."ENFERMEDAD"
    SET nombre_enfermedad='${decodeURIComponent(req.body.nombre_enfermedad)}', procedimiento_tratamiento_enfermedad=
    '${decodeURIComponent(req.body.procedimiento_tratamiento_enfermedad)}'
    WHERE nombre_enfermedad = '${decodeURIComponent(req.params.nombre_enfermedad)}';`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return true;
}

var eliminar_enfermedad = async(nombre_enfermedad) => {
    let consulta = `UPDATE public."ENFERMEDAD"
	SET fue_borrado = true
	WHERE nombre_enfermedad='${nombre_enfermedad}';`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

//Retorna el listado de todas las enfermedades que no tienen etapas
rutas.route('/enfermedades')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_enfermedades().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de enfermedades' });
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
    .post(authorize(["admin"]), (req, res) => {
        //console.log("req.body.nombre_enfermedad", req.body.nombre_enfermedad);
        //console.log("req.body.procedimiento_tratamiento_enfermedad", req.body.procedimiento_tratamiento_enfermedad);
        if (!req.body.nombre_enfermedad || !req.body.procedimiento_tratamiento_enfermedad) {
            res.status(400).send({ message: 'Ingrese todos los campos' });
        } else {
            post_enfermedad(req).then(rta => {
                if (!rta) {
                    res.status(400).send({ message: 'No se pudo insertar la enfermedad' });
                } else {
                    res.status(200).send({ message: 'Se agregé correctamente' });
                }
            }).catch(err => {
                console.log(err);
                res.status(500).send({ message: 'Algo inesperado ocurrió' })
            })
        }
    })


rutas.route('/enfermedad/:nombre_enfermedad')
    .get(authorize(["admin"]), (req, res) => {
        get_enfermedad(decodeURIComponent(req.params.nombre_enfermedad)).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener la enfermedad.' });
            } else {
                res.status(200).send(rta[0]);
                //console.log(rta[0]);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })
    .put(authorize(["admin"]), (req, res) => {
        put_enfermedad(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo editar la enfermedad.' });
            } else {
                res.status(200).send({ message: 'Se editó la enfermedad.' });
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })
    .delete(authorize(["admin"]), (req, res) => {
        eliminar_enfermedad(decodeURIComponent(req.params["nombre_enfermedad"])).then(rta => {
            //console.log("req.params", req.params);
            if (!rta) {
                res.status(400).send({ message: 'No se pudo eliminar la enfermedad.' });
            } else {
                res.status(200).send({ message: 'Se eliminó la enfermedad.' });
            }
        }).catch(err => {
            console.log(err);
            //console.log("req.params", req.params);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })

rutas.route('/enfermedades_etapas_concat')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_enfermedades_etapa_concat().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de enfermedades concat' });
            } else {
                res.status(200).send(rta);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió' });
                console.log(err);
            }
        )
    })

module.exports = {
    rutas,
    get_enfermedad
};