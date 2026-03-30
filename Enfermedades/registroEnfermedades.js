const express = require("express");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const {
    get_registro_enfermedades,
    get_imagenes_registro_enfermedad,
    get_pend_por_tratar,
} = require("./registroEnfermedades.repository");

//Retorna el listado de todos los registros de enfermedades  con y sin etapas
rutas.route('/registro-enfermedades')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_registro_enfermedades().then(rta => {
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

rutas.route('/registro-enfermedades/imagenes/:id')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_imagenes_registro_enfermedad(req.params.id).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener las imagenes del registro' });
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

rutas.route('/registro-enfermedades/pend-por-tratar')
    .get(authorize(["admin", "user"]), (req, res) => {
        get_pend_por_tratar().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener los registros de las palmas pendientes por tratar.' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió.' });
                console.log(err);
            }
        )
    })

module.exports = rutas;
