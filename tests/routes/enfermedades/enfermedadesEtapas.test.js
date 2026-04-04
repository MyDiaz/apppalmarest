const express = require("express");
const request = require("supertest");

const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockGetEtapas = jest.fn();
const mockGetEtapasByName = jest.fn();
const mockDeleteEtapas = jest.fn();
const mockUpdateName = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("../../../Enfermedades/enfermedadesEtapas.repository", () => ({
  get_enfermedades_con_etapas: (...args) => mockGetEtapas(...args),
  get_enfermedad_con_etapas: (...args) => mockGetEtapasByName(...args),
  eliminar_enfermedad_con_etapas: (...args) => mockDeleteEtapas(...args),
  actualizar_nombre_enfermedad: (...args) => mockUpdateName(...args),
}));

describe("enfermedadesEtapas routes", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../Enfermedades/enfermedadesEtapas"));
    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /enfermedad-etapas returns the joined rows", async () => {
    mockGetEtapas.mockResolvedValue({
      rows: [{ id_etapa_enfermedad: 1 }],
    });

    const response = await request(buildApp()).get("/enfermedad-etapas");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id_etapa_enfermedad: 1 }]);
  });

  it("GET /enfermedad-etapas/:nombre_enfermedad returns stage rows", async () => {
    mockGetEtapasByName.mockResolvedValue([{ id_etapa_enfermedad: 1 }]);

    const response = await request(buildApp()).get("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id_etapa_enfermedad: 1 }]);
  });
});
