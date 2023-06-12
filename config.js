const fs = require("fs");
const config = {}

config.connectionData = {
    user: 'postgres',
    host: '176.31.22.252',
    database: 'SIGPA',
    password: 'FtHt%@Q1bXK7',
    port: 65489,
}

config.host = {
    hostname: 'localhost',
    port: '3000'
}


config.auth = {
    token_duration_minutes: 1440,
    password_salt_rounds: 10,
    PUB_KEY: fs.readFileSync("pub_key.pem", 'utf8'),
    PRIV_KEY: fs.readFileSync("priv_key.pem", 'utf8')
}

module.exports = config