const fs = require("fs");
const config = {};

config.connectionData = {
  user: "neondb_owner",
  host: "ep-lucky-firefly-aepa9miq-pooler.c-2.us-east-2.aws.neon.tech",
  database: "neondb",
  password: "npg_EHzFN8Y5WpRB",
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Requerido para sslmode=require
  },
};

config.host = {
  hostname: "0.0.0.0",
  port: "3000",
};

config.auth = {
  token_duration_minutes: 1440,
  password_salt_rounds: 10,
  PUB_KEY: fs.readFileSync("pub_key.pem", "utf8"),
  PRIV_KEY: fs.readFileSync("priv_key.pem", "utf8"),
};

module.exports = config;
