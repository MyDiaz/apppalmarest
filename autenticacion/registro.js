const express = require("express");
const rutas = express.Router();
const { consulta_registrar } = require("./registro.repository");

rutas.post('/usuarios', (req, res) => {
    //pregunta si todos los campos requeridos están presentes
    if (!req.body.cc_usuario || !req.body.nombre_usuario || !req.body.cargo_empresa || !req.body.contrasena_usuario) {
        res.status(400).send({
            message: 'Todos los campos son requeridos'
        });
    } else {
        consulta_registrar(req).then(() => {
            res.status(200).send({
                message: `El usuario se registro exitosamente`
            });
        }).catch(err => {
            console.log(err);
            res.status(400).send({
                message: `El usuario no se pudo registrar`
            });
        })
    }
});

module.exports = rutas;
