//importaciones
const express = require("express");
const bodyParser = require('body-parser');
const expressSanitized = require('express-sanitize-escape');
const cors = require('cors');

//Inicialización del objeto express para cargar elementos en el middleware
const app = express();

//cabeceras
app.use(cors());

//carga de modulos
const config = require('./config');
const lote = require('./Lote/lote');
const registro = require("./autenticacion/registro");
const login = require("./autenticacion/login");
const usuario = require("./usuario/usuario");
const enfermedades = require("./Enfermedades/enfermedades");
const plagas = require("./Plagas/plagas");

//permite que a todos las peticiones se pueda acceder a la propiedad body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use(express.json());
app.use(expressSanitized.middleware());
//protección de las rutas que reciben parametros por la URL
expressSanitized.sanitizeParams(app._router, ['nombre', 'nombre_enfermedad', 'nombre_comun_plaga']);

//carga de rutas
app.use(lote);
app.use(registro);
app.use(login);
app.use(usuario);
app.use(enfermedades);
app.use(plagas);

app.use(function(req, res, next) {
    res.status(404).send({
        error: true,
        codigo: 404,
        mensaje: 'URL no encontrada'
    });
});

app.listen(config.host.port, config.host.hostname, (err) => {
    if (err) {
        console.log("El servidor no esta disponible", err);
        return;
    }
    console.log(`El servidor está corriendo en ${config.host.hostname}:${config.host.port}`);
});