const express = require("express");
const request = require("supertest");

const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockGetRegistros = jest.fn();
const mockGetImagenes = jest.fn();
const mockGetEstadoFitosanitario = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("../../../Enfermedades/registroEnfermedades.repository", () => ({
  get_registro_enfermedades: (...args) => mockGetRegistros(...args),
  get_imagenes_registro_enfermedad: (...args) => mockGetImagenes(...args),
  get_estado_fitosanitario_actual: (...args) => mockGetEstadoFitosanitario(...args),
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

  it("GET /registro-enfermedades/estado-fitosanitario returns the current state payload", async () => {
    mockGetEstadoFitosanitario.mockResolvedValue({
      total_palms_by_lote: [{ nombre_lote: "Lote A", total_palmas: 3 }],
      active_palms: [
        {
          nombre_lote: "Lote A",
          id_palma: 10,
          nombre_enfermedad: "Anillo rojo",
          etapa_enfermedad: "Etapa 1",
          fecha: "2026-04-04",
          estado: "en_tratamiento",
        },
      ],
    });

    const response = await request(buildApp()).get("/registro-enfermedades/estado-fitosanitario");

    expect(response.status).toBe(200);
    expect(response.body.total_palms_by_lote).toEqual([{ nombre_lote: "Lote A", total_palmas: 3 }]);
    expect(response.body.active_palms[0].estado).toBe("en_tratamiento");
  });
});
