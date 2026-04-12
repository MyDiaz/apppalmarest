const express = require("express");
const request = require("supertest");
const bcrypt = require("bcryptjs");

const mockGetUsuario = jest.fn();
const mockAuthorize = jest.fn(() => (req, res, next) => {
  req.account = { sub: { cc_usuario: "123" } };
  next();
});
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  get_usuario: (...args) => mockGetUsuario(...args),
  encriptar_clave: jest.fn(() => "hashed-new-password"),
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("usuario routes", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../usuario/usuario"));
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("GET /usuarios returns the user list", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
    });
    mockQuery.mockResolvedValue({
      rows: [{ cc_usuario: "123", nombre_usuario: "Ana" }],
    });

    const response = await request(buildApp()).get("/usuarios");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ cc_usuario: "123", nombre_usuario: "Ana" }]);
  });

  it("GET /usuarios returns 400 when the repository fails", async () => {
    mockQuery.mockResolvedValue(null);

    const response = await request(buildApp()).get("/usuarios");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("listado de usuarios");
  });

  it("GET /usuarios returns 400 when the repository throws", async () => {
    mockQuery.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/usuarios");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("GET /usuarios/:cc_usuario returns a profile", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      nombre_usuario: "Ana",
      cargo_empresa: "Supervisor",
      telefono: "3000000",
      correo: "ana@example.com",
      rol: "admin",
      validado: true,
    });

    const response = await request(buildApp()).get("/usuarios/123");

    expect(response.status).toBe(200);
    expect(response.body.cc_usuario).toBe("123");
    expect(response.body.rol).toBe("admin");
  });

  it("GET /usuarios/:cc_usuario returns 400 when the user is missing", async () => {
    mockGetUsuario.mockResolvedValue(undefined);

    const response = await request(buildApp()).get("/usuarios/123");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("informaci");
  });

  it("GET /usuarios/:cc_usuario returns 400 when the repository throws", async () => {
    mockGetUsuario.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/usuarios/123");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("PUT /usuarios/:cc_usuario updates the editable fields", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      nombre_usuario: "Ana",
      cargo_empresa: "Supervisor",
      telefono: "3000000",
      correo: "ana@example.com",
      rol: "admin",
      validado: true,
    });
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).put("/usuarios/123").send({
      cc_usuario: "321",
      nombre_usuario: "Ana Perez",
      contrasena_usuario: encodeURIComponent("ClaveSegura#2026"),
      rol: "user",
      cargo_empresa: "Gerente",
      telefono: encodeURIComponent("3100000"),
      correo: "ana.perez@example.com",
      validado: false,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("guard");
  });

  it("PUT /usuarios/:cc_usuario returns 400 when the lookup fails", async () => {
    mockGetUsuario.mockResolvedValue(null);

    const response = await request(buildApp()).put("/usuarios/123").send({
      cc_usuario: "321",
      nombre_usuario: "Ana Perez",
      rol: "user",
      cargo_empresa: "Gerente",
      telefono: encodeURIComponent("3100000"),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("información");
  });

  it("PUT /usuarios/:cc_usuario returns 400 when the update helper fails", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      nombre_usuario: "Ana",
      cargo_empresa: "Supervisor",
      telefono: "3000000",
      correo: "ana@example.com",
      rol: "admin",
      validado: true,
    });
    mockQuery.mockResolvedValue(null);

    const response = await request(buildApp()).put("/usuarios/123").send({
      cc_usuario: "321",
      nombre_usuario: "Ana Perez",
      rol: "user",
      cargo_empresa: "Gerente",
      telefono: encodeURIComponent("3100000"),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("actualizar");
  });

  it("PUT /usuarios/:cc_usuario returns 400 when the update throws", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      nombre_usuario: "Ana",
      cargo_empresa: "Supervisor",
      telefono: "3000000",
      correo: "ana@example.com",
      rol: "admin",
      validado: true,
    });
    mockQuery.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).put("/usuarios/123").send({
      cc_usuario: "321",
      nombre_usuario: "Ana Perez",
      rol: "user",
      cargo_empresa: "Gerente",
      telefono: encodeURIComponent("3100000"),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Error al actualizar usuario");
  });

  it("PUT /self/profile rejects missing fields", async () => {
    const response = await request(buildApp()).put("/self/profile").send({
      nombre_usuario: "",
      telefono: encodeURIComponent("3000000"),
      correo: "ana@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("nombre");
  });

  it("PUT /self/profile rejects a missing phone", async () => {
    const response = await request(buildApp()).put("/self/profile").send({
      nombre_usuario: "Ana Perez",
      telefono: "",
      correo: "ana@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("tel");
  });

  it("PUT /self/profile rejects a missing email", async () => {
    const response = await request(buildApp()).put("/self/profile").send({
      nombre_usuario: "Ana Perez",
      telefono: encodeURIComponent("3000000"),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("correo");
  });

  it("PUT /self/profile returns 200 when the profile is updated", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      nombre_usuario: "Ana",
      cargo_empresa: "Supervisor",
      rol: "admin",
      validado: true,
      telefono: "3000000",
      correo: "ana@example.com",
    });

    const response = await request(buildApp()).put("/self/profile").send({
      nombre_usuario: "Ana Perez",
      telefono: encodeURIComponent("3000000"),
      correo: "ana@example.com",
    });

    expect(response.status).toBe(200);
    expect(response.body.nombre_usuario).toBe("Ana");
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("PUT /self/profile returns 400 when the update helper fails", async () => {
    mockQuery.mockResolvedValue(null);
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      nombre_usuario: "Ana",
      cargo_empresa: "Supervisor",
      rol: "admin",
      validado: true,
      telefono: "3000000",
      correo: "ana@example.com",
    });

    const response = await request(buildApp()).put("/self/profile").send({
      nombre_usuario: "Ana Perez",
      telefono: encodeURIComponent("3000000"),
      correo: "ana@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("obtener la informaci");
  });

  it("PATCH /usuarios/:cc_usuario returns 200 for a valid validation change", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      rol: "user",
    });
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).patch("/usuarios/123").send({
      validado: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.rowCount).toBe(1);
  });

  it("PATCH /usuarios/:cc_usuario returns 400 when the validation value is invalid", async () => {
    const response = await request(buildApp()).patch("/usuarios/123").send({
      validado: "yes",
    });

    expect(response.status).toBe(400);
  });

  it("PATCH /usuarios/:cc_usuario returns 400 when the validation update throws", async () => {
    mockQuery.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).patch("/usuarios/123").send({
      validado: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("deshabilitar");
  });

  it("PATCH /usuarios/:cc_usuario returns 400 when the update fails", async () => {
    mockGetUsuario.mockResolvedValue({
      cc_usuario: "123",
      rol: "user",
    });
    mockQuery.mockResolvedValue(null);

    const response = await request(buildApp()).patch("/usuarios/123").send({
      validado: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("validaci");
  });

  it("PUT /self/password rejects incorrect current password", async () => {
    mockGetUsuario.mockResolvedValue({
      contrasena_usuario: "hashed",
    });
    bcrypt.compare.mockImplementation((plain, hashed, cb) => cb(null, false));

    const response = await request(buildApp()).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("correcta");
  });

  it("PUT /self/password returns 400 when the user is missing", async () => {
    mockGetUsuario.mockResolvedValue(undefined);

    const response = await request(buildApp()).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("informaci");
  });

  it("PUT /self/password returns 400 when the lookup is missing", async () => {
    mockGetUsuario.mockResolvedValue(undefined);

    const response = await request(buildApp()).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("informaci");
  });

  it("PUT /self/password returns 501 when bcrypt fails", async () => {
    mockGetUsuario.mockResolvedValue({
      contrasena_usuario: "hashed",
    });
    bcrypt.compare.mockImplementation((plain, hashed, cb) => cb(new Error("boom")));

    const response = await request(buildApp()).put("/self/password").send({
      contrasena_actual: "ViejaClave#2026",
      contrasena_nueva: "ClaveSegura#2026",
    });

    expect(response.status).toBe(501);
  });
});
