const express = require("express");
const request = require("supertest");

const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockGetEnfermedades = jest.fn();
const mockGetEnfermedad = jest.fn();
const mockGetConcat = jest.fn();
const mockPostEnfermedad = jest.fn();
const mockPutEnfermedad = jest.fn();
const mockDeleteEnfermedad = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("../../../Enfermedades/enfermedades.repository", () => ({
  get_enfermedades: (...args) => mockGetEnfermedades(...args),
  get_enfermedad: (...args) => mockGetEnfermedad(...args),
  get_enfermedades_etapa_concat: (...args) => mockGetConcat(...args),
  post_enfermedad: (...args) => mockPostEnfermedad(...args),
  put_enfermedad: (...args) => mockPutEnfermedad(...args),
  eliminar_enfermedad: (...args) => mockDeleteEnfermedad(...args),
}));

describe("enfermedades routes", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../Enfermedades/enfermedades").rutas);
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /enfermedades returns the active disease list", async () => {
    mockGetEnfermedades.mockResolvedValue({
      rows: [{ nombre_enfermedad: "Rojas" }],
    });

    const response = await request(buildApp()).get("/enfermedades");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ nombre_enfermedad: "Rojas" }]);
  });

  it("POST /enfermedades rejects incomplete payloads", async () => {
    const response = await request(buildApp()).post("/enfermedades").send({
      nombre_enfermedad: "Rojas",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("campos");
  });

  it("GET /enfermedad/:nombre_enfermedad returns the disease row", async () => {
    mockGetEnfermedad.mockResolvedValue([
      { nombre_enfermedad: "Rojas", fue_borrado: false },
    ]);

    const response = await request(buildApp()).get("/enfermedad/Rojas");

    expect(response.status).toBe(200);
    expect(response.body.nombre_enfermedad).toBe("Rojas");
  });
});
