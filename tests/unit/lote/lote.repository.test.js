const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("Lote repository helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("soft_delete_lote uses a parameterized update", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { soft_delete_lote } = require("../../../Lote/lote.repository");

    await soft_delete_lote("Lote%201");

    expect(mockQuery).toHaveBeenCalledWith(
      `UPDATE public."LOTE"
    SET fue_borrado = true
    WHERE nombre_lote = $1;`,
      ["Lote 1"]
    );
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_lotes returns active lot rows", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ nombre_lote: "Lote 1" }],
    });

    const { get_lotes } = require("../../../Lote/lote.repository");
    const result = await get_lotes();

    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "LOTE" where fue_borrado = false;');
    expect(result).toEqual({ rows: [{ nombre_lote: "Lote 1" }] });
  });

  it("post_lote builds the insert statement for a new lot", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { post_lote } = require("../../../Lote/lote.repository");
    const result = await post_lote({
      body: {
        "año_siembra": 2024,
        hectareas: 10,
        nombre_lote: encodeURIComponent("Lote 1"),
        numero_palmas: 100,
        material_siembra: encodeURIComponent("Clon A"),
      },
    });

    expect(mockQuery.mock.calls[0][0]).toContain(`INSERT INTO public."LOTE"`);
    expect(result).toEqual({ rowCount: 1 });
  });

  it("get_lote returns the rows for a specific lot", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ nombre_lote: "Lote 1" }],
    });

    const { get_lote } = require("../../../Lote/lote.repository");
    const result = await get_lote({ params: { nombre: "Lote 1" } });

    expect(mockQuery.mock.calls[0][0]).toContain(`where nombre_lote ='Lote 1'`);
    expect(result).toEqual({ rows: [{ nombre_lote: "Lote 1" }] });
  });

  it("get_lote_mapa returns the stored map when a row exists", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ mapa: "<kml>contenido</kml>" }],
    });

    const { get_lote_mapa } = require("../../../Lote/lote.repository");

    const result = await get_lote_mapa({
      params: { nombre: "Lote 1" },
    });

    expect(mockQuery).toHaveBeenCalledWith(
      `SELECT * FROM "LOTE" where nombre_lote ='Lote 1';`
    );
    expect(result).toBe("<kml>contenido</kml>");
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_lote_mapa returns null when no row exists", async () => {
    mockQuery.mockResolvedValue({
      rows: [],
    });

    const { get_lote_mapa } = require("../../../Lote/lote.repository");

    const result = await get_lote_mapa({
      params: { nombre: "Lote inexistente" },
    });

    expect(result).toBeNull();
  });

  it("update_mapa_lote writes the uploaded KML into the lot", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { update_mapa_lote } = require("../../../Lote/lote.repository");
    const result = await update_mapa_lote({
      params: { nombre: "Lote 1" },
      file: { buffer: Buffer.from("<kml>nuevo</kml>") },
    });

    expect(mockQuery.mock.calls[0][0]).toContain(`UPDATE "LOTE" SET`);
    expect(result).toEqual({ rowCount: 1 });
  });

  it("put_lote updates the lot with the provided fields", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { put_lote } = require("../../../Lote/lote.repository");
    const result = await put_lote({
      params: { nombre: "Lote 1" },
      body: {
        "año_siembra": 2024,
        hectareas: 12,
        nombre_lote: encodeURIComponent("Lote 1"),
        numero_palmas: 110,
        material_siembra: encodeURIComponent("Clon B"),
        mapa: encodeURIComponent("<kml>nuevo</kml>"),
      },
    });

    expect(mockQuery.mock.calls[0][0]).toContain(`UPDATE "LOTE" SET`);
    expect(result).toEqual({ rowCount: 1 });
  });
});
