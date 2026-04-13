const express = require("express");
const request = require("supertest");

const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockGetRegistros = jest.fn();
const mockGetImagenes = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("../../../Enfermedades/registroEnfermedades.repository", () => ({
  get_registro_enfermedades: (...args) => mockGetRegistros(...args),
  get_imagenes_registro_enfermedad: (...args) => mockGetImagenes(...args),
}));

describe("registroEnfermedades routes", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../Enfermedades/registroEnfermedades"));
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /registro-enfermedades returns records", async () => {
    mockGetRegistros.mockResolvedValue({
      rows: [{ id_registro_enfermedad: 1 }],
    });

    const response = await request(buildApp()).get("/registro-enfermedades");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id_registro_enfermedad: 1 }]);
  });

  it("GET /registro-enfermedades/imagenes/:id returns images", async () => {
    mockGetImagenes.mockResolvedValue({
      rows: [{ id: 1 }],
    });

    const response = await request(buildApp()).get("/registro-enfermedades/imagenes/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1 }]);
  });

  it("GET /registro-enfermedades returns 400 when the repository returns nothing", async () => {
    mockGetRegistros.mockResolvedValue(null);

    const response = await request(buildApp()).get("/registro-enfermedades");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("listado");
  });

  it("GET /registro-enfermedades/imagenes/:id returns 400 when the repository throws", async () => {
    mockGetImagenes.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/registro-enfermedades/imagenes/1");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });
});
