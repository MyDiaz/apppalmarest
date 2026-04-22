const express = require("express");
const request = require("supertest");

const mockAuthorize = jest.fn(() => (req, res, next) => next());
const mockGetLotes = jest.fn();
const mockPostLote = jest.fn();
const mockGetLote = jest.fn();
const mockGetLoteMapa = jest.fn();
const mockUpdateMapaLote = jest.fn();
const mockSoftDelete = jest.fn();
const mockPutLote = jest.fn();

jest.mock("../../../autenticacion/util", () => ({
  authorize: (...args) => mockAuthorize(...args),
}));

jest.mock("../../../Lote/lote.repository", () => ({
  get_lotes: (...args) => mockGetLotes(...args),
  post_lote: (...args) => mockPostLote(...args),
  get_lote: (...args) => mockGetLote(...args),
  get_lote_mapa: (...args) => mockGetLoteMapa(...args),
  update_mapa_lote: (...args) => mockUpdateMapaLote(...args),
  soft_delete_lote: (...args) => mockSoftDelete(...args),
  put_lote: (...args) => mockPutLote(...args),
}));

describe("lote routes", () => {
  const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use(require("../../../Lote/lote"));
    return app;
  };

  const lotePayload = () => ({
    nombre_lote: encodeURIComponent("Lote 1"),
    "año_siembra": 2024,
    "año_siembra": 2024,
    hectareas: 10,
    numero_palmas: 100,
    material_siembra: encodeURIComponent("clon"),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /lote returns the active lot list", async () => {
    mockGetLotes.mockResolvedValue({
      rows: [{ nombre_lote: "Lote 1" }],
    });

    const response = await request(buildApp()).get("/lote");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ nombre_lote: "Lote 1" }]);
  });

  it("GET /lote returns 400 when the repository returns nothing", async () => {
    mockGetLotes.mockResolvedValue(null);

    const response = await request(buildApp()).get("/lote");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("listado");
  });

  it("GET /lote returns 400 when the repository throws", async () => {
    mockGetLotes.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/lote");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("POST /lote rejects incomplete payloads", async () => {
    const response = await request(buildApp()).post("/lote").send({
      nombre_lote: "Lote 1",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("campos");
  });

  it("POST /lote returns 200 when the insert succeeds", async () => {
    mockPostLote.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).post("/lote").send(lotePayload());

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("insertó");
  });

  it("POST /lote maps database constraint errors", async () => {
    mockPostLote.mockRejectedValue({ constraint: "hectareas_check" });

    const response = await request(buildApp()).post("/lote").send(lotePayload());

    expect(response.status).toBe(400);
  });

  it.each(["numero_palmas_check", "año_siembra_check", "material_siembra_check"])(
    "POST /lote maps %s database constraint errors",
    async (constraint) => {
      mockPostLote.mockRejectedValue({ constraint });

      const response = await request(buildApp()).post("/lote").send(lotePayload());

      expect(response.status).toBe(400);
    }
  );

  it("POST /lote maps unknown database constraint errors", async () => {
    mockPostLote.mockRejectedValue({ constraint: "other_constraint" });

    const response = await request(buildApp()).post("/lote").send(lotePayload());

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Error inesperado");
  });

  it("GET /lote/:nombre returns a lot record", async () => {
    mockGetLote.mockResolvedValue({
      rows: [{ nombre_lote: "Lote 1" }],
    });

    const response = await request(buildApp()).get("/lote/Lote%201");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ nombre_lote: "Lote 1" }]);
  });

  it("GET /lote/:nombre returns 400 when no lot is found", async () => {
    mockGetLote.mockResolvedValue(null);

    const response = await request(buildApp()).get("/lote/Lote%201");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("información");
  });

  it("GET /lote/:nombre returns 400 when the repository throws", async () => {
    mockGetLote.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/lote/Lote%201");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("DELETE /lote/:nombre returns 200 when the delete succeeds", async () => {
    mockSoftDelete.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp()).delete("/lote/Lote%201");

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("eliminó");
  });

  it("DELETE /lote/:nombre returns 400 when nothing was deleted", async () => {
    mockSoftDelete.mockResolvedValue(null);

    const response = await request(buildApp()).delete("/lote/Lote%201");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("eliminar");
  });

  it("DELETE /lote/:nombre returns 500 when the repository throws", async () => {
    mockSoftDelete.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).delete("/lote/Lote%201");

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("GET /lote/mapa/:nombre returns the KML content type", async () => {
    mockGetLoteMapa.mockResolvedValue("<kml>contenido</kml>");

    const response = await request(buildApp()).get("/lote/mapa/Lote%201");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/vnd.google-earth.kml+xml");
    expect(response.text).toContain("<kml>contenido</kml>");
  });

  it("GET /lote/mapa/:nombre returns 400 when the map is missing", async () => {
    mockGetLoteMapa.mockResolvedValue(null);

    const response = await request(buildApp()).get("/lote/mapa/Lote%201");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("mapa");
  });

  it("GET /lote/mapa/:nombre returns 400 when the repository throws", async () => {
    mockGetLoteMapa.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp()).get("/lote/mapa/Lote%201");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Algo inesperado");
  });

  it("PUT /lote/mapa/:nombre returns 200 when the map update succeeds", async () => {
    mockUpdateMapaLote.mockResolvedValue({ rowCount: 1 });

    const response = await request(buildApp())
      .put("/lote/mapa/Lote%201")
      .send({
        file: {
          buffer: Buffer.from("<kml>nuevo</kml>"),
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("actualizó");
  });

  it("PUT /lote/mapa/:nombre returns 400 when the repository throws", async () => {
    mockUpdateMapaLote.mockRejectedValue(new Error("boom"));

    const response = await request(buildApp())
      .put("/lote/mapa/Lote%201")
      .send({
        file: {
          buffer: Buffer.from("<kml>nuevo</kml>"),
        },
      });

    expect(response.status).toBe(400);
    expect(response.text).toContain("No se pudo actualizar el lote");
  });

  it.each(["hectareas_check", "numero_palmas_check", "año_siembra_check", "material_siembra_check"])(
    "PUT /lote/:nombre maps %s database constraint errors",
    async (constraint) => {
      mockPutLote.mockRejectedValue({ constraint });

      const response = await request(buildApp()).put("/lote/Lote%201").send({
        nombre_lote: encodeURIComponent("Lote 1"),
        "año_siembra": 2024,
        hectareas: 10,
        numero_palmas: 100,
        material_siembra: encodeURIComponent("clon"),
        mapa: encodeURIComponent("<kml>nuevo</kml>"),
      });

      expect(response.status).toBe(400);
    }
  );
});
