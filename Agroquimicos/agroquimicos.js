const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const { authorize } = require("../autenticacion/util");
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);

var getAgroquimicos = async(req) => {
    let consulta = `SELECT id_producto_agroquimico, nombre_producto_agroquimico, tipo_producto_agroquimico 
    FROM "PRODUCTO_AGROQUIMICO" where fue_borrado = false;`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var getAgroquimico = async(id_producto_agroquimico) => {
    let consulta = `SELECT * FROM "PRODUCTO_AGROQUIMICO" 
    where id_producto_agroquimico = ${id_producto_agroquimico};`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var postAgroquimico = async(req) => {
    let consulta = `INSERT INTO public."PRODUCTO_AGROQUIMICO"(
        nombre_producto_agroquimico, 
        tipo_producto_agroquimico,
        clase_producto, 
        presentacion_producto_agroquimico, 
        ingrediente_activo_producto_agroquimico, 
        periodo_carencia_producto_agroquimico)
        VALUES ('${decodeURIComponent(req.body.nombre_producto_agroquimico)}',
                '${decodeURIComponent(req.body.tipo_producto_agroquimico)}', 
                '${decodeURIComponent(req.body.clase_producto)}', 
                '${decodeURIComponent(req.body.presentacion_producto_agroquimico)}', 
                '${decodeURIComponent(req.body.ingrediente_activo_producto_agroquimico)}', 
                ${decodeURIComponent(req.body.periodo_carencia_producto_agroquimico)});`;
    console.log(consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var actualizarAgroquimico = async(req) => {
    console.log(req.body);
    let consulta = `UPDATE public."PRODUCTO_AGROQUIMICO" set
    nombre_producto_agroquimico = '${decodeURIComponent(req.body.nombre_producto_agroquimico)}', 
    tipo_producto_agroquimico = '${decodeURIComponent(req.body.tipo_producto_agroquimico)}',
    clase_producto = '${decodeURIComponent(req.body.clase_producto)}',
    ingrediente_activo_producto_agroquimico = '${decodeURIComponent(req.body.ingrediente_activo_producto_agroquimico)}',
    periodo_carencia_producto_agroquimico = ${decodeURIComponent(req.body.periodo_carencia_producto_agroquimico)},
    presentacion_producto_agroquimico = '${decodeURIComponent(req.body.presentacion_producto_agroquimico)}'
	WHERE id_producto_agroquimico = ${req.params.id_producto_agroquimico};`;
    console.log("actualizarAgroquimico-", consulta);
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

var eliminarAgroquimico = async(id_producto_agroquimico) => {
    let consulta = `UPDATE public."PRODUCTO_AGROQUIMICO"
	SET  fue_borrado = true
	WHERE id_producto_agroquimico = ${id_producto_agroquimico};`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}

rutas.route('/agroquimico')
    .post(authorize(["admin"]), (req, res) => {
        if (!req.body.nombre_producto_agroquimico || !req.body.tipo_producto_agroquimico ||
            !req.body.clase_producto || !req.body.presentacion_producto_agroquimico ||
            !req.body.ingrediente_activo_producto_agroquimico || !req.body.periodo_carencia_producto_agroquimico) {
            res.status(400).send({ message: 'Todos los campos son requeridos' });
        } else {
            postAgroquimico(req).then(rta => {
                res.status(200).send({ message: "El agroquímico se insertó correctamente" });
            }).catch(err => {
                var text;
                switch (err.constraint) {
                    case "periodoCarenciaCheck":
                        text = "El periodo de carencia debe ser mayor a cero";
                        break;
                }
                res.status(400).send({ message: `${text}. No se pudo registrar el nuevo agroquímico` });
            })
        }
    })
    .get(authorize(["admin", "user"]), (req, res) => {
        getAgroquimicos().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de agroquimicos.' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                console.log('Algo inesperado ocurrió obteniendo el listado de agroquimicos', err);
                res.status(400).send({ message: 'Algo inesperado ocurrió obteniendo el listado de agroquimicos' });
            }
        )
    })

rutas.route('/agroquimico/:id_producto_agroquimico')
    .get(authorize(["admin"]), (req, res) => {
        getAgroquimico(req.params.id_producto_agroquimico).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el agroquímico.' });
            } else {
                res.status(200).send(rta.rows[0]);
                console.log(rta);
            }
        }).catch(err => {
            console.log('Algo inesperado ocurrió obteniendo el agroquimico', err);
            res.status(500).send({ message: 'Algo inesperado ocurrió obteniendo el agroquimico.' })
        })
    })
    .put(authorize(["admin"]), (req, res) => {
        if (!req.body.nombre_producto_agroquimico || !req.body.tipo_producto_agroquimico ||
            !req.body.clase_producto || !req.body.presentacion_producto_agroquimico ||
            !req.body.ingrediente_activo_producto_agroquimico || !req.body.periodo_carencia_producto_agroquimico) {
            res.status(400).send({ message: 'Todos los campos son requeridos' });
        } else {
            actualizarAgroquimico(req).then(rta => {
                if (!rta) {
                    res.status(400).send({ message: `No se pudo editar el agroquímico ${req.body.nombre_producto_agroquimico}.` });
                } else {
                    res.status(200).send({ message: `Se editó correctamente el agroquímico ${req.body.nombre_producto_agroquimico}.` });
                }
            }).catch(err => {
                console.log('Algo inesperado ocurrió editando el agroquimico', err);
                res.status(500).send({ message: 'Algo inesperado ocurrió editando el agroquimico.' })
            })
        }
    })
    .delete(authorize(["admin"]), (req, res) => {
        eliminarAgroquimico(req.params.id_producto_agroquimico).then(rta => {
            if (!rta) {
                res.status(400).send({ message: `No se pudo eliminar el agroquímico.` });
            } else {
                res.status(200).send({ message: `Se eliminó correctamente el agroquímico ${req.body.nombre_producto_agroquimico}.` });
            }
        }).catch(err => {
            console.log('Algo inesperado ocurrió eliminando el agroquimico', err);
            res.status(500).send({ message: 'Algo inesperado ocurrió eliminando el agroquimico.' })
        })
    })

module.exports = rutas