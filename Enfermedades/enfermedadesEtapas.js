const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

//retorna las enfermedades y sus etapas registradas en la base de datos
var get_enfermedades_con_etapas = async() => {
    let consulta = `select * from "ETAPAS_ENFERMEDAD"
    inner join
    "ENFERMEDAD" on 
	"ETAPAS_ENFERMEDAD".nombre_enfermedad = "ENFERMEDAD".nombre_enfermedad 
	where "ENFERMEDAD".fue_borrado = false and "ETAPAS_ENFERMEDAD".fue_borrado = false;`
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    console.log("get_enfermedad_con_etapas", rta);
    cliente_bd.release();
    return rta;
}

var post__enfermedad_con_etapas = async(req) => {
    let values = "";
    let numero_etapas = req.body.etapas_enfermedad.length;
    var enfermedad;
    let nombre_enfermedad_decode = decodeURIComponent(req.body.nombre_enfermedad);
    await get_enfermedad(nombre_enfermedad_decode).then(rta => {
        enfermedad = rta;
        //console.log("enfermedad", enfermedad);
    }).catch(err => {
        console.log(err);
    });
    //console.log("enfermedad afuera", enfermedad);
    if (enfermedad.length == 0) {
        let values = "";
        for (let i = 0; i < numero_etapas; i = i + 1) {
            values = values +
                `('${decodeURIComponent(req.body.etapas_enfermedad[i])}','${nombre_enfermedad_decode}', 
            '${decodeURIComponent(req.body.tratamiento_etapa_enfermedad[i])}'),`
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
    } else {
        console.log("ya esta la enfermedad");
        for (let i = 0; i < numero_etapas; i = i + 1) {
            values = values +
                `('${decodeURIComponent(req.body.etapas_enfermedad[i])}','${nombre_enfermedad_decode}', 
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

var actualizar_enfermedad_con_etapas = async(req) => {
    function estaVacio(elemento) {
        return elemento === '';
    }

    algo_tratamiento = req.body.tratamiento_etapa_enfermedad.findIndex(estaVacio) == -1;
    algo_etapas = req.body.etapas_enfermedad.findIndex(estaVacio) == -1;

    if (!req.params.nombre_enfermedad || !algo_tratamiento || !algo_etapas) {
        res.status(400).send({ message: 'Ingrese todos los campos' });
    } else {
        try {
            rta = await get_enfermedad_con_etapas(req.params.nombre_enfermedad);
        } catch (err) {
            console.log(err);
            res.status(500).send({ message: `Algo inesperado ocurrió obteniendo la enfermedad ${req.params["nombre_enfermedad"]}.` })
        }

        let ids_viejos = rta.map(etapa => { return etapa.id_etapa_enfermedad });
        let ids_nuevos = req.body.ids_etapas_enfermedad;
        let tratamientos = req.body.tratamientos_etapa_enfermedad.map(tratamiento => { return decodeURIComponent(tratamiento) });
        let etapas = req.body.etapas_enfermedad.map(etapa => { return decodeURIComponent(etapa) });

        for (let i = 0; i < ids_nuevos.length; i++) {
            if (ids_nuevos[i] == -1) {
                //se agrega una nueva etapa en la bd's
                try {
                    rta = await post_etapa_enfermedad(etapas[i], req.params["nombre_enfermedad"], tratamientos[i]);
                    if (!rta) {
                        res.status(400).send({ message: `No se pudo insertar la etapa de la enfermedad ${req.params["nombre_enfermedad"]}` });
                    }
                } catch (err) {
                    res.status(500).send({ message: `Algo inesperado ocurrió tratando de agregar una nueva etapa en la ${req.params["nombre_enfermedad"]}` })
                    console.log(err);
                };
            } else {
                //se modifica una etapa que ya estaba en la bd's
                try {
                    rta = await actualizar_etapa_enfermedad(ids_nuevos[i], etapas[i], tratamientos[i], );
                    if (!rta) {
                        res.status(400).send({ message: `No se pudo actualizar la etapa de la enfermedad ${req.params["nombre_enfermedad"]}` });
                    }
                } catch (err) {
                    res.status(500).send({ message: `Algo inesperado ocurrió actualizando la etapa de la enfermedad ${req.params["nombre_enfermedad"]}` })
                    console.log(err);
                };
            }
        }
        for (let i = 0; i < ids_viejos.length; i++) {
            if (!ids_nuevos.includes(ids_viejos[i])) {
                //hago un borrado lógico
                try {
                    rta = await eliminar_etapa_enfermedad(ids_viejos[i]);
                    if (!rta) {
                        res.status(400).send({ message: `No se pudo eliminar la etapa de la enfermedad ${req.params["nombre_enfermedad"]}.` });
                    }
                } catch (err) {
                    res.status(500).send({ message: `Algo inesperado ocurrió eliminando la etapa de la enfermedad ${req.params["nombre_enfermedad"]}.` });
                    console.log(err);
                };
            }
        }
        try {
            rta = await actualizar_nombre_enfermedad(req.body.nombre_enfermedad, req.params["nombre_enfermedad"])
            if (!rta) {
                res.status(400).send({ message: `No se pudo editar el nombre de la enfermedad ${req.params["nombre_enfermedad"]}.` });
            }
        } catch (err) {
            res.status(500).send({ message: `Algo inesperado ocurrió eliminando la etapa de la enfermedad ${req.params["nombre_enfermedad"]}.` });
            console.log(err);
        };
        res.status(200).send({ message: `Se editó correctamente la enfermedad.` });
    }
}

var eliminar_enfermedad_con_etapas = async(req) => {
    let consulta = `UPDATE public."ENFERMEDADES"
	SET fue_borrado=true WHERE nombre_comun_plaga = '${nombre_comun_plaga}';`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var get_enfermedad_con_etapas = async(nombre_enfermedad) => {
    //id_etapa_enfermedad = id_etapa_enfermedad.toString()
    let consulta = `SELECT * FROM "ETAPAS_ENFERMEDAD" where nombre_enfermedad = '${nombre_enfermedad}'
    and fue_borrado = false;`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta.rows;
}

var post_etapa_enfermedad = async(etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad) => {
    let consulta = `INSERT INTO public."ETAPAS_ENFERMEDAD"(
        etapa_enfermedad, nombre_enfermedad, tratamiento_etapa_enfermedad)
        VALUES ('${decodeURIComponent(etapa_enfermedad)}', 
        '${decodeURIComponent(nombre_enfermedad)}', '${decodeURIComponent(tratamiento_etapa_enfermedad)}');`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var actualizar_etapa_enfermedad = async(id_etapa_enfermedad, etapa_enfermedad, tratamiento_etapa_enfermedad) => {
    let consulta = `UPDATE public."ETAPAS_ENFERMEDAD"
	SET etapa_enfermedad='${etapa_enfermedad}', tratamiento_etapa_enfermedad='${tratamiento_etapa_enfermedad}'
    WHERE id_etapa_enfermedad=${id_etapa_enfermedad};`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var eliminar_etapa_enfermedad = async(nombre_enfermedad) => {
    let consulta = `update public."ENFERMEDAD" set fue_borrado = true
    where nombre_enfermedad = '${nombre_enfermedad}';`
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var actualizar_nombre_enfermedad = async(nombre_enfermedad_nuevo, nombre_enfermedad_viejo) => {
    let consulta = `UPDATE public."ENFERMEDAD"
	SET nombre_enfermedad='${decodeURIComponent(nombre_enfermedad_nuevo)}'
    WHERE nombre_comun_plaga='${nombre_enfermedad_viejo}';`
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/enfermedad-etapas')
    .get((req, res) => {
        get_enfermedades_con_etapas().then(rta => {
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
            post__enfermedad_con_etapas(req).then(rta => {
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
        get_enfermedad_con_etapas(decodeURIComponent(req.params.nombre_enfermedad)).then(rta => {
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
    }).delete((req, res) => {
        eliminar_enfermedad_con_etapas(decodeURIComponent(req.params["nombre_enfermedad"])).then(rta => {
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
    .put((req, res) => {
        actualizar_enfermedad_con_etapas(req, res).then(rta => {})
    })

module.exports = rutas;