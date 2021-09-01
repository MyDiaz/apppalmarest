const express = require("express");
const config = require('../config');
const { Pool } = require('pg');
const rutas = express.Router();

const BaseDatos = new Pool(config.connectionData);


var post_registro_enfermedad = async(req) => {
    

}