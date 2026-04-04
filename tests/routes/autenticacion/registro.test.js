const express = require("express");
const request = require("supertest");

const mockConsultaRegistrar = jest.fn();

jest.mock("../../../autenticacion/registro.repository", () => ({
  consulta_registrar: (...args) => mockConsultaRegistrar(...args),
}));

describe("POST /usuarios", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../autenticacion/registro"));
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const app = buildApp();
    const response = await request(app).post("/usuarios").send({
      cc_usuario: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("requeridos");
    expect(mockConsultaRegistrar).not.toHaveBeenCalled();
  });

  it("returns 200 when registration succeeds", async () => {
    mockConsultaRegistrar.mockResolvedValue({ rowCount: 1 });

    const app = buildApp();
    const response = await request(app).post("/usuarios").send({
      cc_usuario: "123",
      nombre_usuario: encodeURIComponent("Ana Perez"),
      cargo_empresa: encodeURIComponent("Supervisor"),
      contrasena_usuario: encodeURIComponent("ClaveSegura#2026"),
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("exitosamente");
    expect(mockConsultaRegistrar).toHaveBeenCalledTimes(1);
  });
});
