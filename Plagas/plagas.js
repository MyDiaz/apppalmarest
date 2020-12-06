const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

var get_plagas = async() => {
    let consulta = 'SELECT * FROM "ETAPAS_PLAGA";';
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_plaga = async(nombre_comun_plaga) => {
    let consulta = `SELECT * FROM "ETAPAS_PLAGA" where nombre_comun_plaga = '${nombre_comun_plaga}';`;
    //console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta.rows;
}

var post_etapas_plaga = async(req) => {
    let values = "";
    let numero_etapas_plaga = req.body.etapas_plaga.length;
    let nombre_plaga_decode = decodeURIComponent(req.body.nombre_comun_plaga);
    /*await get_enfermedad(nombre_plaga_decode).then(rta => {
        enfermedad = rta;
        console.log("enfermedad", enfermedad);
    }).catch(err => {
        console.log(err);
    });*/
    //if (enfermedad.length == 0) {
    for (let i = 0; i < numero_etapas_plaga; i = i + 1) {
        values = values + `('${decodeURIComponent(req.body.nombre_etapa_plaga[i])}','${nombre_plaga_decode}', 
                                    '${decodeURIComponent(req.body.procedimiento_etapa_plaga[i])}'),`
    }
    let consulta_plaga = `INSERT INTO public."PLAGA"(nombre_comun_plaga) VALUES 
            ('${nombre_plaga_decode}');`;
    let consulta_etapas = `INSERT INTO public."ETAPAS_ENFERMEDAD" 
            (nombre_etapa_plaga, nombre_comun_plaga, procedimiento_etapa_plaga)
            VALUES ${values}`;
    consulta_etapas = consulta_etapas.slice(0, -1) + ";";
    let consulta = `${consulta_plaga} ${consulta_etapas}`;
    console.log("consulta", consulta);
    const cliente_bd = await BaseDatos.connect();
    var resp = await cliente_bd.query(consulta);
    cliente_bd.release();
    console.log("resp", resp);
    return resp;
    /*} else {
            console.log("ya esta la enfermedad");
            for (let i = 0; i < numero_etapas; i = i + 1) {
                values = values + `('${decodeURIComponent(req.body.etapas_enfermedad[i])}','${nombre_enfermedad_decode}', 
                                        '${decodeURIComponent(req.body.tratamiento_etapa_enfermedad[i])}'),`
            }
            let consulta = `INSERT INTO public."ETAPAS_ENFERMEDAD" 
                (etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad)
                VALUES ${values}`;
            consulta = consulta.slice(0, -1) + ";";
            const cliente_bd = await BaseDatos.connect();
            var rta = await cliente_bd.query(consulta);
            cliente_bd.release();
            return rta;
        }*/
}

var eliminar_plaga = async(nombre_comun_plaga) => {
    let consulta = `DELETE FROM public."PLAGA" WHERE nombre_comun_plaga = '${nombre_comun_plaga}';`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/plagas')
    .get((req, res) => {
        get_plagas().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de plagas' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => { res.status(400).send({ message: 'Algo inesperado ocurrió' }); }
        )
    })
    .post((req, res) => {
        console.log("body", req.body);

        function estaVacio(elemento) {
            return elemento === '';
        }
        //si es TRUE es pq el array req.body.tratamiento_etapa_enfermedad tiene elementos
        console.log("tipo de variable", typeof req.body.procedimiento_etapa_plaga);
        algo_tratamiento = req.body.procedimiento_etapa_plaga.findIndex(estaVacio) == -1;
        algo_etapas = req.body.nombre_etapa_plaga.findIndex(estaVacio) == -1;
        /*console.log("algo_tratamiento",algo_tratamiento);
        console.log("algo_etapas",algo_etapas);
        console.log(req.body);
        console.log("etpas", req.body.etapas_enfermedad.length);
        console.log("trta", req.body.tratamiento_etapa_enfermedad.length);*/
        if (!req.body.nombre_comun_plaga || !algo_tratamiento || !algo_etapas) {
            res.status(400).send({ message: 'Ingrese todos los campos' });
        } else {
            post_etapas_plaga(req).then(rta => {
                console.log("rta en post", rta);
                if (!rta) {
                    res.status(400).send({ message: 'No se pudo insertar la plaga' });
                } else {
                    res.status(200).send({ message: 'Se agregó correctamente' });
                }
            }).catch(err => {
                res.status(500).send({ message: 'Algo inesperado ocurrió' })
                console.log(err);
            });
        }
    })

rutas.route('/plaga/:nombre_comun_plaga')
    .get((req, res) => {
        get_enfermedad(decodeURIComponent(req.params.nombre_comun_plaga)).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener la plaga.' });
            } else {
                res.status(200).send(rta[0]);
                console.log(rta[0]);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })
    .delete((req, res) => {
        eliminar_plaga(decodeURIComponent(req.params["nombre_comun_plaga"])).then(rta => {
            console.log("req.params", req.params);
            if (!rta) {
                res.status(400).send({ message: 'No se pudo eliminar la plaga.' });
            } else {
                res.status(200).send({ message: 'Se eliminó la plaga.' });
            }
        }).catch(err => {
            console.log(err);
            console.log("req.params", req.params);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })

module.exports = rutas;