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

  it("get_informe_mensual returns zero percentages when total_palmas is zero", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total_palmas: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id_registro_enfermedad: 1 }] });

    const { get_informe_mensual } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_informe_mensual({ mes: "2026-04" });

    expect(result.incidencia_real).toBe(0);
    expect(result.incidencia_acumulada).toBe(0);
    expect(result.total_casos_mes).toBe(2);
    expect(result.total_casos_acumulados).toBe(3);
    expect(result.evolucion.reincidencia).toBe(1);
    expect(result.registros).toEqual([{ id_registro_enfermedad: 1 }]);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_informe_mensual separates pending and recovery cases by treatment existence", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total_palmas: 100 }] })
      .mockResolvedValueOnce({ rows: [{ total: 4 }] })
      .mockResolvedValueOnce({ rows: [{ total: 10 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total: 7 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const { get_informe_mensual } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_informe_mensual({ mes: "2026-04" });

    expect(mockQuery.mock.calls[4][0]).toContain("NOT EXISTS");
    expect(mockQuery.mock.calls[4][0]).toContain(`FROM "TRATAMIENTO" T`);
    expect(mockQuery.mock.calls[5][0]).toContain("EXISTS");
    expect(mockQuery.mock.calls[5][0]).toContain(`FROM "TRATAMIENTO" T`);
    expect(result.evolucion.pendientes_por_tratar).toBe(3);
    expect(result.evolucion.en_recuperacion).toBe(7);
    expect(result.incidencia_real).toBe(10);
    expect(result.incidencia_acumulada).toBe(10);
  });

  it("get_informe_mensual counts reincidencia only when there is a previous matching disease record", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total_palmas: 50 }] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const { get_informe_mensual } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_informe_mensual({
      fecha: "2026-04-20",
      lote: "Lote A",
      enfermedad: "Anillo rojo",
    });

    const reincidenciaQuery = mockQuery.mock.calls[8][0];
    expect(reincidenciaQuery).toContain(`FROM "REGISTRO_ENFERMEDAD" PREV`);
    expect(reincidenciaQuery).toContain("PREV.id_palma = RE.id_palma");
    expect(reincidenciaQuery).toContain("PREV.nombre_enfermedad = RE.nombre_enfermedad");
    expect(reincidenciaQuery).toContain("PREV.fecha_registro_enfermedad < RE.fecha_registro_enfermedad");
    expect(mockQuery.mock.calls[8][1]).toEqual(["Lote A", "Anillo rojo", expect.any(Date), expect.any(Date)]);
    expect(result.evolucion.reincidencia).toBe(1);
  });

  it("get_informe_mensual separates pending eradication from pending treatment and recovery", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total_palmas: 100 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 11 }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total: 5 }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const { get_informe_mensual } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_informe_mensual({ mes: "2026-05", lote: "CASA VIEJA" });

    expect(mockQuery.mock.calls[3][0]).toContain("causa_erradicacion_etapa");
    expect(mockQuery.mock.calls[3][0]).toContain("causa_erradicacion_enfermedad");
    expect(mockQuery.mock.calls[4][0]).toContain("AND NOT (");
    expect(mockQuery.mock.calls[5][0]).toContain("AND NOT (");
    expect(result.evolucion.pendientes_por_erradicar).toBe(3);
    expect(result.evolucion.pendientes_por_tratar).toBe(5);
    expect(result.evolucion.en_recuperacion).toBe(3);
  });

  it("get_informe_mensual returns monthly records with the same fields as get_registro_enfermedades", async () => {
    const registros = [
      {
        id_palma: 10,
        nombre_enfermedad: "Anillo rojo",
        id_registro_enfermedad: 1,
        etapa_enfermedad: "Etapa 1",
        nombre_lote: "Lote A",
        fecha_registro_enfermedad: "2026-04-20",
        observacion_registro_enfermedad: "Obs",
      },
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: [{ total_palmas: 50 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: registros });

    const { get_informe_mensual } = require("../../../Enfermedades/registroEnfermedades.repository");
    const result = await get_informe_mensual({ mes: "2026-04" });

    const registrosQuery = mockQuery.mock.calls[9][0];
    expect(registrosQuery).toContain("P.id_palma");
    expect(registrosQuery).toContain("RE.nombre_enfermedad");
    expect(registrosQuery).toContain("RE.id_registro_enfermedad");
    expect(registrosQuery).toContain("EE.etapa_enfermedad");
    expect(registrosQuery).toContain("P.nombre_lote");
    expect(registrosQuery).toContain("RE.fecha_registro_enfermedad");
    expect(registrosQuery).toContain("RE.observacion_registro_enfermedad");
    expect(result.registros).toEqual(registros);
  });
});
