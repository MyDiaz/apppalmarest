const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();
const { authorize } = require("../autenticacion/util");
const format = require('pg-format');
const BaseDatos = new Pool(config.connectionData);
const { StringDecoder } = require('node:string_decoder');


var post_cosechas = async (req) => {
    const cliente_bd = await BaseDatos.connect();
    var diarias;
    for (i in req.body.data) {
        var auxcosecha =  req.body.data[i]["cosecha"];
        var diarias =  req.body.data[i]["diarias"];

        const decoder = new StringDecoder('utf8');
        
        var cosechavalues = [];
        const { id_cosecha, nombre_lote, fecha_ingreso, fecha_salida, cantidad_racimos, kilos, id_viaje, estado_cosecha } = auxcosecha;

        const cent = Buffer.from(nombre_lote);
        cosechavalues.push([id_cosecha,decoder.write(cent) , fecha_ingreso, fecha_salida, cantidad_racimos, kilos, id_viaje, estado_cosecha]);
        
        let sqlCosecha = format(`INSERT INTO public."COSECHA"(id_cosecha, nombre_lote, fecha_ingreso, fecha_salida, cantidad_racimos, kilos, id_viaje, estado_cosecha) VALUES %L ON CONFLICT (id_cosecha) DO UPDATE 
        SET cantidad_racimos = excluded.cantidad_racimos, 
        kilos = excluded.kilos;`, cosechavalues);

        var cosechadiariavalues = [];
        for(j in diarias){
            var auxcosechadiaria = diarias[j];
            const { id_cosecha,id_cosecha_diaria,fecha_cosecha,kilos_racimos_dia,cantidad_racimos_dia,responsable} = auxcosechadiaria;
                cosechadiariavalues.push([id_cosecha,id_cosecha_diaria,fecha_cosecha,kilos_racimos_dia,cantidad_racimos_dia,responsable]);
        }
        
        let sqlCosechaDiaria = format(`INSERT INTO public."COSECHA_DIARIA"(id_cosecha,id_cosecha_diaria,fecha_cosecha,kilos_racimos_dia,cantidad_racimos_dia,responsable) VALUES %L`, cosechadiariavalues);

        let rtaCosecha = await cliente_bd.query(sqlCosecha);
        let rtaCosechasDiarias = await cliente_bd.query(sqlCosechaDiaria);
    }
    cliente_bd.release();
    return true;
}


var get_cosechas = async () => {
    let consulta = `SELECT * FROM "COSECHA"`;
    const cliente_bd = await BaseDatos.connect();
    let rta = await cliente_bd.query(consulta);
    cliente_bd.release();
    return rta;
}


rutas.route('/movil/cosechas')
    .get((req, res) => {
        get_cosechas().then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo obtener el listado de palmas' });
            } else {
                res.status(200).send(rta.rows);
            }
        }).catch(
            err => {
                res.status(400).send({ message: 'Algo inesperado ocurrió' });
                console.log(err);
            }
        )
    }).post(authorize(["admin"]), (req, res) => {
        post_cosechas(req).then(rta => {
            if (!rta) {
                res.status(400).send({ message: 'No se pudo insertar las palmas' });
            } else {
                res.status(200).send({ message: 'Se agregé correctamente' });
            }
        }).catch(err => {
            console.log(err);
            res.status(500).send({ message: 'Algo inesperado ocurrió' })
        })
        // }
    })


module.exports = rutas;