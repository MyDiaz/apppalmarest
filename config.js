const fs = require("fs");
const config = {}

config.connectionData = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'SIGPA',
    password: '4l3ym4t1',
    port: 5432,
}

config.host = {
    hostname: 'localhost',
    port: '3000'
}

module.exports = config