const express = require("express");
const request = require("supertest");
const bcrypt = require("bcryptjs");

const mockGetUsuario = jest.fn();
const mockGenerarToken = jest.fn(() => "signed-token");

jest.mock("../../../autenticacion/util", () => ({
  get_usuario: (...args) => mockGetUsuario(...args),
  generar_token: (...args) => mockGenerarToken(...args),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

describe("POST /login", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../autenticacion/login"));
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when the user does not exist", async () => {
    mockGetUsuario.mockResolvedValue(undefined);

    const app = buildApp();
    const response = await request(app).post("/login").send({
      cc_usuario: "123",
      contrasena_usuario: "secret",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("returns 401 when the user is not validated", async () => {
    mockGetUsuario.mockResolvedValue({
      validado: false,
    });

    const app = buildApp();
    const response = await request(app).post("/login").send({
      cc_usuario: "123",
      contrasena_usuario: "secret",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toContain("validado");
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("returns 401 when the password is invalid", async () => {
    mockGetUsuario.mockResolvedValue({
      validado: true,
      cc_usuario: "123",
      contrasena_usuario: "hashed",
      rol: "user",
    });
    bcrypt.compare.mockImplementation((plain, hashed, cb) => cb(null, false));

    const app = buildApp();
    const response = await request(app).post("/login").send({
      cc_usuario: "123",
      contrasena_usuario: "wrong",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(mockGenerarToken).not.toHaveBeenCalled();
  });

  it("returns 200 with a token when credentials are valid", async () => {
    mockGetUsuario.mockResolvedValue({
      validado: true,
      cc_usuario: "123",
      contrasena_usuario: "hashed",
      rol: "admin",
    });
    bcrypt.compare.mockImplementation((plain, hashed, cb) => cb(null, true));

    const app = buildApp();
    const response = await request(app).post("/login").send({
      cc_usuario: "123",
      contrasena_usuario: "secret",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBe("signed-token");
    expect(response.body.rol).toBe("admin");
  });
});
