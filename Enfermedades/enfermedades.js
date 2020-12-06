const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

//retorna las enfermedades y sus etapas registradas en la base de datos
var get_enfermedades_etapas = async() => {
    let consulta = 'SELECT * FROM "ETAPAS_ENFERMEDAD";';
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_enfermedades = async() => {
    let consulta = `SELECT * FROM "ENFERMEDAD" where procedimiento_tratamiento_enfermedad != 'NULL';`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
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

var get_enfermedad_etapa = async(nombre_enfermedad) => {
    //id_enfermedad = id_enfermedad.toString()
    let consulta = `SELECT * FROM "ETAPAS_ENFERMEDAD" where nombre_enfermedad = '${nombre_enfermedad}';`;
    console.log(consulta);
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

var post_etapas_enfermedad = async(req) => {
    let values = "";
    let numero_etapas = req.body.etapas_enfermedad.length;
    var enfermedad;
    let nombre_enfermedad_decode = decodeURIComponent(req.body.nombre_enfermedad);
    await get_enfermedad(nombre_enfermedad_decode).then(rta => {
        enfermedad = rta;
        console.log("enfermedad", enfermedad);
    }).catch(err => {
        console.log(err);
    });
    console.log("enfermedad afuera", enfermedad);
    if (enfermedad.length == 0) {
        let values = "";
        for (let i = 0; i < numero_etapas; i = i + 1) {
            values = values + `('${decodeURIComponent(req.body.etapas_enfermedad[i])}','${nombre_enfermedad_decode}', 
                                    '${decodeURIComponent(req.body.tratamiento_etapa_enfermedad[i])}'),`
        }
        let consulta_enfermedad = `INSERT INTO public."ENFERMEDAD"(nombre_enfermedad) VALUES 
            ('${nombre_enfermedad_decode}');`;
        let consulta_etapas = `INSERT INTO public."ETAPAS_ENFERMEDAD" 
            (etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad)
            VALUES ${values}`;
        consulta_etapas = consulta_etapas.slice(0, -1) + ";";
        let consulta = `${consulta_enfermedad} ${consulta_etapas}`;
        console.log("consulta", consulta);
        const cliente_bd = await BaseDatos.connect();
        var resp = await cliente_bd.query(consulta);
        cliente_bd.release();
        console.log("resp", resp);
        return resp;
    } else {
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
    }
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
    let consulta = `DELETE FROM public."ENFERMEDAD" WHERE nombre_enfermedad = '${nombre_enfermedad}';`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

//Retorna el listado de todas las enfermedades que no tienen etapas
rutas.route('/enfermedades')
    .get((req, res) => {
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
    .post((req, res) => {
        console.log("req.body.nombre_enfermedad", req.body.nombre_enfermedad);
        console.log("req.body.procedimiento_tratamiento_enfermedad", req.body.procedimiento_tratamiento_enfermedad);
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
    .get((req, res) => {
        get_enfermedad(decodeURIComponent(req.params.nombre_enfermedad)).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener la enfermedad.' });
            } else {
                res.status(200).send(rta[0]);
                console.log(rta[0]);
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })
    .put((req, res) => {
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
    .delete((req, res) => {
        eliminar_enfermedad(decodeURIComponent(req.params["nombre_enfermedad"])).then(rta => {
            console.log("req.params", req.params);
            if (!rta) {
                res.status(400).send({ message: 'No se pudo eliminar la enfermedad.' });
            } else {
                res.status(200).send({ message: 'Se eliminó la enfermedad.' });
            }
        }).catch(err => {
            console.log(err);
            console.log("req.params", req.params);
            res.status(500).send({ message: 'Algo inesperado ocurrió.' })
        })
    })

rutas.route('/enfermedad-etapas')
    .get((req, res) => {
        get_enfermedades_etapas().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de enfermedades' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => { res.status(400).send({ message: 'Algo inesperado ocurrió' }); }
        )
    })
    .post((req, res) => {
        function estaVacio(elemento) {
            return elemento === '';
        }
        //si es TRUE es pq el array req.body.tratamiento_etapa_enfermedad tiene elementos
        algo_tratamiento = req.body.tratamiento_etapa_enfermedad.findIndex(estaVacio) == -1;
        algo_etapas = req.body.etapas_enfermedad.findIndex(estaVacio) == -1;
        /*console.log("algo_tratamiento",algo_tratamiento);
        console.log("algo_etapas",algo_etapas);
        console.log(req.body);
        console.log("etpas", req.body.etapas_enfermedad.length);
        console.log("trta", req.body.tratamiento_etapa_enfermedad.length);*/
        if (!req.body.nombre_enfermedad || !algo_tratamiento || !algo_etapas) {
            res.status(400).send({ message: 'Ingrese todos los campos' });
        } else {
            post_etapas_enfermedad(req).then(rta => {
                console.log("rta en post", rta);
                if (!rta) {
                    res.status(400).send({ message: 'No se pudo insertar la enfermedad' });
                } else {
                    res.status(200).send({ message: 'Se agregó correctamente' });
                }
            }).catch(err => {
                res.status(500).send({ message: 'Algo inesperado ocurrió' })
                console.log(err);
            });
        }
    })

rutas.route('/enfermedad-etapas/:nombre_enfermedad')
    .get((req, res) => {
        get_enfermedad_etapa(decodeURIComponent(req.params.nombre_enfermedad)).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de enfermedades' });
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

module.exports = rutas;