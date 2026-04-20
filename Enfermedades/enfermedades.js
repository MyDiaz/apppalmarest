const express = require("express");
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const {
  get_enfermedades,
  get_enfermedad,
  get_enfermedades_etapa_concat,
  post_enfermedad,
  put_enfermedad,
  eliminar_enfermedad,
} = require("./enfermedades.repository");

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
                    res.status(200).send({ message: 'Se agregó correctamente' });
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
