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
      rows: [{ nombre_enfermedad: "Pudrición de Cogollo" }],
    });

    const response = await request(buildApp()).get("/enfermedades");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ nombre_enfermedad: "Pudrición de Cogollo" }]);
  });

  it("GET /enfermedades returns error", async () => {
    mockGetEnfermedades.mockResolvedValue(undefined);
    const response = await request(buildApp()).get("/enfermedades");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "No se pudo obtener el listado de enfermedades" });
  });

  it("POST /enfermedades rejects incomplete payloads", async () => {
    const response = await request(buildApp()).post("/enfermedades").send({
      nombre_enfermedad: "Pudrición de Cogollo",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("campos");
  });

  it("GET /enfermedad/:nombre_enfermedad returns the disease row", async () => {
    mockGetEnfermedad.mockResolvedValue([
      { nombre_enfermedad: "Pudrición de Cogollo", fue_borrado: false },
    ]);

    const response = await request(buildApp()).get("/enfermedad/Pudrición de Cogollo");

    expect(response.status).toBe(200);
    expect(response.body.nombre_enfermedad).toBe("Pudrición de Cogollo");
  });

  it("GET /enfermedad/:nombre_enfermedad returns 400 when the disease is missing", async () => {
    mockGetEnfermedad.mockResolvedValue(null);

    const response = await request(buildApp()).get("/enfermedad/Pudrición de Cogollo");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("enfermedad");
  });

  it("GET /enfermedad/:nombre_enfermedad returns 500 when the repository throws", async () => {
    mockGetEnfermedad.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/enfermedad/Pudrición de Cogollo");

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("POST /enfermedades returns 200 when insertion succeeds", async () => {
    mockPostEnfermedad.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).post("/enfermedades").send({
      nombre_enfermedad: encodeURIComponent("Pudrición de Cogollo"),
      procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("agreg");
  });

  it("POST /enfermedades returns 400 when insertion returns nothing", async () => {
    mockPostEnfermedad.mockResolvedValue(null);

    const response = await request(buildApp()).post("/enfermedades").send({
      nombre_enfermedad: encodeURIComponent("Pudrición de Cogollo"),
      procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("insertar");
  });

  it("POST /enfermedades returns 500 when insertion throws", async () => {
    mockPostEnfermedad.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).post("/enfermedades").send({
      nombre_enfermedad: encodeURIComponent("Pudrición de Cogollo"),
      procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("PUT /enfermedad/:nombre_enfermedad returns 400 when update returns nothing", async () => {
    mockPutEnfermedad.mockResolvedValue(null);

    const response = await request(buildApp()).put("/enfermedad/Pudrición de Cogollo").send({
      nombre_enfermedad: encodeURIComponent("Nueva enfermedad"),
      procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("editar");
  });

  it("PUT /enfermedad/:nombre_enfermedad returns 500 when update throws", async () => {
    mockPutEnfermedad.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).put("/enfermedad/Pudrición de Cogollo").send({
      nombre_enfermedad: encodeURIComponent("Nueva enfermedad"),
      procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("DELETE /enfermedad/:nombre_enfermedad returns 400 when delete returns nothing", async () => {
    mockDeleteEnfermedad.mockResolvedValue(null);

    const response = await request(buildApp()).delete("/enfermedad/Pudrición de Cogollo");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("eliminar");
  });

  it("DELETE /enfermedad/:nombre_enfermedad returns 500 when delete throws", async () => {
    mockDeleteEnfermedad.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).delete("/enfermedad/Pudrición de Cogollo");

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("GET /enfermedades_etapas_concat returns the joined rows", async () => {
    mockGetConcat.mockResolvedValue([{ concat: "Pudrición de Cogollo etapa 1" }]);

    const response = await request(buildApp()).get("/enfermedades_etapas_concat");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ concat: "Pudrición de Cogollo etapa 1" }]);
  });

  it("GET /enfermedades_etapas_concat returns 400 when the repository returns nothing", async () => {
    mockGetConcat.mockResolvedValue(null);

    const response = await request(buildApp()).get("/enfermedades_etapas_concat");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("concat");
  });

  it("GET /enfermedades_etapas_concat returns 400 when the repository throws", async () => {
    mockGetConcat.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/enfermedades_etapas_concat");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });
});
