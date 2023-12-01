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
const enfermedadesEtapas = require("./Enfermedades/enfermedadesEtapas");
const plagas = require("./Plagas/plagas");
const agroquimicos = require("./Agroquimicos/agroquimicos");
const cosechas = require("./Cosechas/cosechas");
const podas = require("./Podas/podas");
const plateos = require("./Plateos/plateos");
const movilEnfermedades = require("./Movil/enfermedades")
const movilAgroquimicos = require("./Movil/agroquimicos")
const movilPlagas = require("./Lote/plagas")
const movilPalmas = require("./Movil/palmas")
const movilCosechas = require("./Movil/cosechas")
const viajes = require("./Viajes/viajes");
const censos = require("./Censo/censo");
const registroEnfermedades = require("./Enfermedades/registroEnfermedades");
const registroTratamientos = require("./Tratamientos/tratamientos");
const fumigaciones = require("./Censo/fumigaciones");
const historiaClinicaPalma = require("./Palma/palma");
const erradicaciones = require("./Palma/erradicacion");
const precipitaciones = require("./Precipitaciones/precipitaciones");
const censoProductivo = require("./censo_productivo/censo_productivo");

const movilTratamientos = require("./Movil/tratamientos")
const movilPlateos = require("./Movil/plateos")
const movilPodas = require("./Movil/podas")
const movilViajes = require("./Movil/viajes")
const movilFertilizantes = require("./Movil/fertilizantes")
const movilFertilizaciones = require("./Movil/fertilizaciones")
const movilCensosPlagas = require("./Movil/censosplagas")
const movilAplicaciones = require("./Movil/aplicaciones")
const movilPrecipitaciones = require("./Movil/precipitaciones")
//permite que a todos las peticiones se pueda acceder a la propiedad body
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(bodyParser.text({ limit: '200mb' }));
//app.use(express.json());
app.use(expressSanitized.middleware());
//protección de las rutas que reciben parametros por la URL
expressSanitized.sanitizeParams(app._router, ['nombre', 'nombre_enfermedad', 'nombre_comun_plaga', 'id_producto_agroquimico']);

//carga de rutas
app.use(lote);
app.use(registro);
app.use(login);
app.use(usuario);
app.use(enfermedades.rutas);
app.use(enfermedadesEtapas);
app.use(plagas);
app.use(agroquimicos);
app.use(cosechas);
app.use(podas);
app.use(plateos);
app.use(movilEnfermedades);
app.use(movilPlagas);
app.use(movilAgroquimicos);
app.use(movilPalmas);
app.use(movilFertilizantes);
app.use(movilFertilizaciones);
app.use(movilCensosPlagas);
app.use(movilAplicaciones);
app.use(viajes);
app.use(censos);
app.use(movilTratamientos);
app.use(movilPlateos);
app.use(movilPodas);
app.use(movilCosechas);
app.use(movilViajes);
app.use(movilPrecipitaciones);
app.use(censos);
app.use(registroEnfermedades);
app.use(registroTratamientos);
app.use(fumigaciones);
app.use(historiaClinicaPalma);
app.use(erradicaciones);
app.use(precipitaciones);
app.use(censoProductivo);

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