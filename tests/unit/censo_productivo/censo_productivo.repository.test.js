const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("censo_productivo repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("postCensoProductivo inserts new rows and updates existing rows", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id_censo_productivo: 10 }],
      })
      .mockResolvedValueOnce({
        rowCount: 1,
      });

    const {
      postCensoProductivo,
    } = require("../../../censo_productivo/censo_productivo.repository");

    const result = await postCensoProductivo({
      body: {
        data: [
          {
            fecha_registro_censo_productivo: "2024-01-01",
            nombre_lote: Buffer.from("Lote 1").toString(),
            cantidad_palmas_leidas: 1,
            cantidad_flores_femeninas: 2,
            cantidad_flores_masculinas: 3,
            cantidad_racimos_verdes: 4,
            cantidad_racimos_pintones: 5,
            cantidad_racimos_sobremaduros: 6,
            cantidad_racimos_maduros: 7,
            cc_usuario: "123",
          },
          {
            id_censo_productivo: 99,
            fecha_registro_censo_productivo: "2024-01-02",
            nombre_lote: Buffer.from("Lote 2").toString(),
            cantidad_palmas_leidas: 8,
            cantidad_flores_femeninas: 9,
            cantidad_flores_masculinas: 10,
            cantidad_racimos_verdes: 11,
            cantidad_racimos_pintones: 12,
            cantidad_racimos_sobremaduros: 13,
            cantidad_racimos_maduros: 14,
            cc_usuario: "123",
          },
        ],
      },
    });

    expect(result).toEqual({
      success: true,
      censosIds: [10],
    });
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("postCensoProductivo returns false when an insert fails", async () => {
    mockQuery.mockRejectedValueOnce(new Error("db error"));

    const {
      postCensoProductivo,
    } = require("../../../censo_productivo/censo_productivo.repository");

    const result = await postCensoProductivo({
      body: {
        data: [
          {
            fecha_registro_censo_productivo: "2024-01-01",
            nombre_lote: Buffer.from("Lote 1").toString(),
            cantidad_palmas_leidas: 1,
            cantidad_flores_femeninas: 2,
            cantidad_flores_masculinas: 3,
            cantidad_racimos_verdes: 4,
            cantidad_racimos_pintones: 5,
            cantidad_racimos_sobremaduros: 6,
            cantidad_racimos_maduros: 7,
            cc_usuario: "123",
          },
        ],
      },
    });

    expect(result).toEqual({ success: false });
  });
});
