const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const { Client } = require('pg');

const connectionData = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'SIGPA',
    password: '4l3ym4t1',
    port: 5432,
}
const client = new Client(connectionData)

client.connect();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
/*let usuario = {
    nombre: '',
    apellido: ''
};

app.get('/', function(req, res, next) {
    client.query('SELECT * FROM "LOTE";', function(err, result) {
        if (err) {
            console.log(err);
            res.status(400).send(err);
        }
        console.log(result.rows);
        res.status(200).send(result.rows);
    });
});*/

let respuesta = {
    error: false,
    codigo: 200,
    mensaje: ''
};

app.route('/lote')
    .get(function(req, res) {
        client.query('SELECT * FROM "LOTE";', function(err, rta) {
            if (err) {
                console.log(err);
                res.status(400).send(err);
            } else {
                console.log(rta.rows);
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
    .post(function(req, res) {
        if (!req.body.nombre || !req.body.apellido) {
            respuesta = {
                error: true,
                codigo: 502,
                mensaje: 'El campo nombre y apellido son requeridos'
            };
        } else {
            if (usuario.nombre !== '' || usuario.apellido !== '') {
                respuesta = {
                    error: true,
                    codigo: 503,
                    mensaje: 'El usuario ya fue creado previamente'
                };
            } else {
                usuario = {
                    nombre: req.body.nombre,
                    apellido: req.body.apellido
                };
                respuesta = {
                    error: false,
                    codigo: 200,
                    mensaje: 'Usuario creado',
                    respuesta: usuario
                };
            }
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