const bcrypt = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const config = require("../../../config");

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
  })),
}));

const {
  encriptar_clave,
  generar_token,
} = require("../../../autenticacion/util");

describe("autenticacion/util", () => {
  describe("encriptar_clave", () => {
    it("hashes the password and keeps it verifiable", () => {
      const plainPassword = "ClaveSegura#2026";

      const hashedPassword = encriptar_clave(plainPassword);

      expect(hashedPassword).toBeTruthy();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(bcrypt.compareSync(plainPassword, hashedPassword)).toBe(true);
    });
  });

  describe("generar_token", () => {
    it("creates an RS256 token with the expected subject payload", () => {
      const token = generar_token("123456", "admin");

      const decoded = jsonwebtoken.verify(token, config.auth.PUB_KEY, {
        algorithms: ["RS256"],
      });

      expect(decoded.sub).toEqual({
        cc_usuario: "123456",
        rol: "admin",
      });
      expect(decoded.iat).toEqual(expect.any(Number));
      expect(decoded.exp).toEqual(expect.any(Number));
    });
  });
});
