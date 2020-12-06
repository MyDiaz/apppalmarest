const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
//dos librerias necesarias para la configuración del passport-jwt
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
//librerias para establecer la conexión a la base de datos
const { Pool } = require('pg');
const config = require('../config');
const BaseDatos = new Pool(config.connectionData);

const rutas = express.Router();

var get_usuario = async(cc_usuario) => {
    let consulta = `SELECT cc_usuario, contrasena_usuario FROM "USUARIO" WHERE cc_usuario = '${cc_usuario}';`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    let user = rta.rows[0];
    return user;
}

var generar_token = (cc_usuario) => {
    const payload = { sub: cc_usuario };

    return jsonwebtoken.sign(payload,
        config.keys.PRIV_KEY, {
            expiresIn: "1d",
            notBefore: "0d",
            algorithm: 'RS256'
        }
    );
}

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.keys.PUB_KEY,
    algorithms: ['RS256']
};

passport.use(new JwtStrategy(options, function(jwt_payload, done) {
    get_usuario(jwt_payload.sub).then(
        user => {
            if (!user) {
                return done(null, false); //Usuario no encontrado
            } else {
                return done(null, user);
            }
        }).catch(
        err => done(err)
    )
}));

rutas.post('/login', function(req, res) {
    get_usuario(req.body.cc_usuario).then(user => {
        if (!user) {
            res.status(401).send({ success: false, message: "Usuario no encontrado" });
        } else {
            bcrypt.compare(req.body.contrasena_usuario, user.contrasena_usuario, (err, isValid) => {
                if (err) {
                    res.status(501).send({ message: "Error inesperado" });
                }
                if (!isValid) {
                    res.status(401).send({ success: false, message: "Contraseña inválida" });
                } else {
                    const fecha_creacion_ms = Date.now();
                    const fecha_expiracion_ms = fecha_creacion_ms + 86400000; //86400000 corresponde a sumar un dia en ms

                    const signedToken = generar_token(req.body.cc_usuario);

                    res.status(200).send({
                        success: true,
                        token: signedToken,
                        vence: fecha_expiracion_ms,
                        creacion: fecha_creacion_ms
                    });
                }
            })
        }
    }).catch(err => {
        res.status(501).send({ message: "Ha ocurrido un error, intentelo más tarde!" })
    })
});

rutas.get('/protegido',
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => {
        res.status(200).send({
            success: true,
            message: "You are successfully authenticated to this route!"
        });
    }
);

module.exports = rutas;