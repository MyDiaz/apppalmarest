//importaciones
const express = require("express");
const bodyParser = require('body-parser');
const expressSanitized = require('express-sanitize-escape');
const cors = require('cors');

const lote = require('./Lote/lote');

//Inicialización del objeto express para cargar elementos en el middleware
const app = express();

//cabeceras
app.use(cors());

//Configuracion de conexiones y demás
const config = require('./config');

//permite que a todos las peticiones se pueda acceder a la propiedad body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressSanitized.middleware());
//protección de las rutas que reciben parametros por la URL
expressSanitized.sanitizeParams(app._router, ['nombre']);

//carga de modulos
app.use(lote.app);

//carga de rutas

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