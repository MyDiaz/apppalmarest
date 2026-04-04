const express = require("express");
const request = require("supertest");

const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockGetEtapas = jest.fn();
const mockGetEtapasByName = jest.fn();
const mockPostEtapas = jest.fn();
const mockDeleteEtapas = jest.fn();
const mockUpdateName = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("../../../Enfermedades/enfermedadesEtapas.repository", () => ({
  get_enfermedades_con_etapas: (...args) => mockGetEtapas(...args),
  get_enfermedad_con_etapas: (...args) => mockGetEtapasByName(...args),
  post_enfermedad_con_etapas: (...args) => mockPostEtapas(...args),
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

  it("GET /enfermedad-etapas returns 400 when the repository returns nothing", async () => {
    mockGetEtapas.mockResolvedValue(null);

    const response = await request(buildApp()).get("/enfermedad-etapas");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("listado");
  });

  it("POST /enfermedad-etapas rejects incomplete payloads", async () => {
    const response = await request(buildApp()).post("/enfermedad-etapas").send({
      nombre_enfermedad: "Rojas",
      etapas_enfermedad: [""],
      tratamiento_etapa_enfermedad: ["Tratamiento"],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("campos");
  });

  it("POST /enfermedad-etapas returns 200 when the repository succeeds", async () => {
    mockPostEtapas.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).post("/enfermedad-etapas").send({
      nombre_enfermedad: encodeURIComponent("Rojas"),
      etapas_enfermedad: [encodeURIComponent("Etapa 1")],
      tratamiento_etapa_enfermedad: [encodeURIComponent("Tratamiento 1")],
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("correctamente");
  });

  it("POST /enfermedad-etapas returns 400 when the repository returns nothing", async () => {
    mockPostEtapas.mockResolvedValue(null);

    const response = await request(buildApp()).post("/enfermedad-etapas").send({
      nombre_enfermedad: encodeURIComponent("Rojas"),
      etapas_enfermedad: [encodeURIComponent("Etapa 1")],
      tratamiento_etapa_enfermedad: [encodeURIComponent("Tratamiento 1")],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("insertar");
  });

  it("POST /enfermedad-etapas returns 500 when the repository throws", async () => {
    mockPostEtapas.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).post("/enfermedad-etapas").send({
      nombre_enfermedad: encodeURIComponent("Rojas"),
      etapas_enfermedad: [encodeURIComponent("Etapa 1")],
      tratamiento_etapa_enfermedad: [encodeURIComponent("Tratamiento 1")],
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("GET /enfermedad-etapas/:nombre_enfermedad returns stage rows", async () => {
    mockGetEtapasByName.mockResolvedValue([{ id_etapa_enfermedad: 1 }]);

    const response = await request(buildApp()).get("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id_etapa_enfermedad: 1 }]);
  });

  it("GET /enfermedad-etapas/:nombre_enfermedad returns 400 when no rows are found", async () => {
    mockGetEtapasByName.mockResolvedValue(null);

    const response = await request(buildApp()).get("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("listado");
  });

  it("GET /enfermedad-etapas/:nombre_enfermedad returns 400 when the repository throws", async () => {
    mockGetEtapasByName.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("DELETE /enfermedad-etapas/:nombre_enfermedad returns 200 when deletion succeeds", async () => {
    mockDeleteEtapas.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).delete("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("elimin");
  });

  it("DELETE /enfermedad-etapas/:nombre_enfermedad returns 400 when deletion returns nothing", async () => {
    mockDeleteEtapas.mockResolvedValue(null);

    const response = await request(buildApp()).delete("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("eliminar");
  });

  it("DELETE /enfermedad-etapas/:nombre_enfermedad returns 500 when the repository throws", async () => {
    mockDeleteEtapas.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).delete("/enfermedad-etapas/Rojas");

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });
});
