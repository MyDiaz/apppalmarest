const express = require("express");
const bodyParser = require('body-parser');
const expressSanitized = require('express-sanitize-escape');
var cors = require('cors');

const app = express();
const { Client } = require('pg');
const { text } = require("express");

app.use(cors());

const connectionData = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'SIGPA',
    password: '4l3ym4t1',
    port: 5432,
}
const client = new Client(connectionData)

client.connect();

// Configurar cabeceras y cors
/*app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    next();

    app.options('*', (req, res) => {
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
        res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
        res.send();
    });
});*/

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(expressSanitized.middleware());


let respuesta = {
    error: false,
    codigo: 200,
    mensaje: ''
};

expressSanitized.sanitizeParams(app._router, ['nombre']);

//retorna el nombre de todos los lotes registrados en la base de datos
app.route('/lote')
    .get(function(req, res) {
        client.query('SELECT nombre_lote FROM "LOTE";', function(err, rta) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            } else {
                //console.log(rta.rows);
                res.status(200).send(rta.rows);
            }
        })
    })
    .post(function(req, res) {
        //pregunta si todos los campos requeridos están presentes 
        if (!req.body.nombre_lote || !req.body["año_siembra"] || !req.body.hectareas ||
            !req.body.numero_palmas || !req.body.material_siembra) {
            res.status(400).send({
                message: 'Todos los campos son requeridos'
            });
            console.log("from bk", req.body);
        } else {
            let consulta = `INSERT INTO public."LOTE"("año_siembra", hectareas, nombre_lote, 
            numero_palmas, material_siembra) VALUES (${req.body["año_siembra"]}, 
            ${req.body.hectareas}, '${req.body.nombre_lote}', ${req.body.numero_palmas},
            '${req.body.material_siembra}');`;
            //console.log(consulta);
            client.query(consulta, function(err, rta) {
                if (err) {
                    console.log("error Bk", err);
                    var text;
                    switch (err.constraint) {
                        case "hectareas_check":
                            text = "Las hectareas deben ser mayor a cero";
                            break;
                        case "numero_palmas_check":
                            text = "El número de palmas deben ser mayor a cero";
                            break;
                        case "año_siembra_check":
                            text = "El año siembra debe ser mayor a cero";
                            break;
                        default:
                            text = "Error inesperado de base de datos";
                    }
                    res.status(400).send({
                        message: text + ". " + 'No se pudo registrar el nuevo lote'
                    });
                } else {
                    //console.log(rta);
                    res.status(200).send({
                        message: "El lote se insertó correctamente"
                    });
                }
            });
        }
    })
    .put(function(req, res) {

    });

//retorna los datos de un lote registrado en la base de datos    
app.route('/lote/:nombre')
    .get(function(req, res) {
        var query_string = 'SELECT * FROM "LOTE" where nombre_lote=' + '\'' + req.params.nombre + '\'' + ';';
        console.log(query_string);
        client.query(query_string, function(err, rta) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            } else {
                //console.log(rta.rows);
                res.status(200).send(rta.rows);
            }
        })
    });


/*app.route('/usuario')
    .get(function(req, res) {
        respuesta = {
            error: false,
            codigo: 200,
            mensaje: ''
        };
        if (usuario.nombre === '' || usuario.apellido === '') {
            respuesta = {
                error: true,
                codigo: 501,
                mensaje: 'El usuario no ha sido creado'
            };
        } else {
            respuesta = {
                error: false,
                codigo: 200,
                mensaje: 'respuesta del usuario',
                respuesta: usuario
            };
        }
        res.send(respuesta);
    })
    
    .put(function(req, res) {
        if (!req.body.nombre || !req.body.apellido) {
            respuesta = {
                error: true,
                codigo: 502,
                mensaje: 'El campo nombre y apellido son requeridos'
            };
        } else {
            if (usuario.nombre === '' || usuario.apellido === '') {
                respuesta = {
                    error: true,
                    codigo: 501,
                    mensaje: 'El usuario no ha sido creado'
                };
            } else {
                usuario = {
                    nombre: req.body.nombre,
                    apellido: req.body.apellido
                };
                respuesta = {
                    error: false,
                    codigo: 200,
                    mensaje: 'Usuario actualizado',
                    respuesta: usuario
                };
            }
        }

        res.send(respuesta);
    })
    .delete(function(req, res) {
        if (usuario.nombre === '' || usuario.apellido === '') {
            respuesta = {
                error: true,
                codigo: 501,
                mensaje: 'El usuario no ha sido creado'
            };
        } else {
            respuesta = {
                error: false,
                codigo: 200,
                mensaje: 'Usuario eliminado'
            };
            usuario = {
                nombre: '',
                apellido: ''
            };
        }
        res.send(respuesta);
    });
    */
app.use(function(req, res, next) {
    respuesta = {
        error: true,
        codigo: 404,
        mensaje: 'URL no encontrada'
    };
    res.status(404).send(respuesta);
});
app.listen(3000, () => {
    console.log("El servidor está inicializado en el puerto 3000");
});