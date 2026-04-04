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
});
