const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("registroEnfermedades repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("get_registro_enfermedades queries joined records", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id_registro_enfermedad: 1 }] });

    const { get_registro_enfermedades } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_registro_enfermedades();

    expect(mockQuery.mock.calls[0][0]).toContain(`FROM "REGISTRO_ENFERMEDAD"`);
    expect(result).toEqual({ rows: [{ id_registro_enfermedad: 1 }] });
  });

  it("get_imagenes_registro_enfermedad uses a formatted query", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });

    const { get_imagenes_registro_enfermedad } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_imagenes_registro_enfermedad("15");

    expect(mockQuery.mock.calls[0][0]).toContain(`WHERE id_registro_enfermedad = '15'`);
    expect(result).toEqual({ rows: [{ id: 1 }] });
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_registro_enfermedades releases the client even when the query returns nothing", async () => {
    mockQuery.mockResolvedValue(null);

    const { get_registro_enfermedades } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_registro_enfermedades();

    expect(result).toBeNull();
  });

  it("get_estado_fitosanitario_actual returns total palms and active palms", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ nombre_lote: "Lote A", total_palmas: 3 }] })
      .mockResolvedValueOnce({
        rows: [
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

    const { get_estado_fitosanitario_actual } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_estado_fitosanitario_actual();

    expect(mockQuery.mock.calls[0][0]).toContain(`FROM "LOTE"`);
    expect(mockQuery.mock.calls[1][0]).toContain(`WHERE RE.dada_de_alta IS NOT TRUE`);
    expect(mockQuery.mock.calls[1][0]).toContain(`NOT EXISTS`);
    expect(mockQuery.mock.calls[1][0]).toContain(`FROM "ERRADICACION" ER`);
    expect(mockQuery.mock.calls[1][0]).toContain(`causa_erradicacion_enfermedad`);
    expect(mockQuery.mock.calls[1][0]).toContain(`causa_erradicacion_etapa`);
    expect(result).toEqual({
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
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
