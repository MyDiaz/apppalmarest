const fs = require("fs");
const config = {};

const envOrDefault = (name, defaultValue) => process.env[name] ?? defaultValue;

config.connectionData = {
  user: envOrDefault("DB_USER", "postgres"),
  host: envOrDefault("DB_HOST", "localhost"),
  database: envOrDefault("DB_NAME", "SIGPA"),
  password: envOrDefault("DB_PASSWORD", ""),
  port: Number(envOrDefault("DB_PORT", 5432)),
  ssl: {
    rejectUnauthorized: false, // Requerido para sslmode=require
  },
};

config.host = {
  hostname: "0.0.0.0",
  port: Number(envOrDefault("PORT", 3000)),
  api_prefix: envOrDefault("API_PREFIX", "/api"),
};

config.auth = {
  token_duration_minutes: 1440,
  password_salt_rounds: 10,
  PUB_KEY: fs.readFileSync("pub_key.pem", "utf8"),
  PRIV_KEY: fs.readFileSync("priv_key.pem", "utf8"),
};

module.exports = config;
