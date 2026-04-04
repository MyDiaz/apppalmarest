const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("censo_productivo helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("get_censo_min_year returns the year from the minimum census date", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ min: new Date("2024-06-11T00:00:00.000Z") }],
    });

    const {
      get_censo_min_year,
    } = require("../../../censo_productivo/censo_productivo.repository");

    const result = await get_censo_min_year();

    expect(result).toBe(2024);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_censo_productivo_lote queries by lot using parameters", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ nombre_lote: "Lote 1" }],
    });

    const {
      get_censo_productivo_lote,
    } = require("../../../censo_productivo/censo_productivo.repository");

    const result = await get_censo_productivo_lote("Lote 1");

    expect(mockQuery).toHaveBeenCalledWith(
      `
  SELECT cp.*, u.*
  FROM 
    public."CENSO_PRODUCTIVO" cp
  INNER JOIN 
    public."USUARIO" u ON cp.cc_usuario = u.cc_usuario
  WHERE 
    cp.nombre_lote = $1;`,
      ["Lote 1"]
    );
    expect(result).toEqual({
      rows: [{ nombre_lote: "Lote 1" }],
    });
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
