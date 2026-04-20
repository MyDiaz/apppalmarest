const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("Enfermedades repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("get_enfermedades queries active diseases", async () => {
    mockQuery.mockResolvedValue({ rows: [{ nombre_enfermedad: "Rojas" }] });

    const { get_enfermedades } = require("../../../Enfermedades/enfermedades.repository");
    const result = await get_enfermedades();

    expect(mockQuery).toHaveBeenCalledWith(
      `SELECT * FROM "ENFERMEDAD" where procedimiento_tratamiento_enfermedad != 'NULL' 
    and 
    fue_borrado = false;`
    );
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ rows: [{ nombre_enfermedad: "Rojas" }] });
  });

  it("get_enfermedad returns the rows array", async () => {
    mockQuery.mockResolvedValue({ rows: [{ nombre_enfermedad: "Fusariosis" }] });

    const { get_enfermedad } = require("../../../Enfermedades/enfermedades.repository");
    const result = await get_enfermedad("Fusariosis");

    expect(mockQuery).toHaveBeenCalledWith(
      `SELECT * FROM "ENFERMEDAD" where nombre_enfermedad = 'Fusariosis';`
    );
    expect(result).toEqual([{ nombre_enfermedad: "Fusariosis" }]);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_enfermedades_etapa_concat returns the joined rows", async () => {
    mockQuery.mockResolvedValue({ rows: [{ concat: "Fusariosis etapa 1" }] });

    const { get_enfermedades_etapa_concat } = require("../../../Enfermedades/enfermedades.repository");
    const result = await get_enfermedades_etapa_concat();

    expect(mockQuery).toHaveBeenCalledWith(
      `SELECT concat(E.nombre_enfermedad,' ', EE.etapa_enfermedad)
    FROM "ENFERMEDAD" AS E
    LEFT JOIN "ETAPAS_ENFERMEDAD" AS EE
    ON E.nombre_enfermedad = EE.nombre_enfermedad
    where E.fue_borrado = false;`
    );
    expect(result).toEqual([{ concat: "Fusariosis etapa 1" }]);
  });

  it("eliminar_enfermedad issues a soft delete for the disease and its stages", async () => {
    mockQuery.mockResolvedValue({ rowCount: 2 });

    const { eliminar_enfermedad } = require("../../../Enfermedades/enfermedades.repository");
    const result = await eliminar_enfermedad("Anillo rojo");

    expect(mockQuery.mock.calls[0][0]).toContain(`SET fue_borrado = true`);
    expect(mockQuery.mock.calls[0][0]).toContain(`WHERE nombre_enfermedad='Anillo rojo'`);
    expect(result).toEqual({ rowCount: 2 });
  });

  it("post_enfermedad inserts a new disease when none exists", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const { post_enfermedad } = require("../../../Enfermedades/enfermedades.repository");
    const result = await post_enfermedad({
      body: {
        nombre_enfermedad: encodeURIComponent("Rojas"),
        procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
        causa_erradicacion_enfermedad: true,
      },
    });

    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockQuery.mock.calls[1][0]).toContain(`INSERT INTO public."ENFERMEDAD"`);
    expect(mockQuery.mock.calls[1][0]).toContain(`causa_erradicacion_enfermedad) VALUES`);
    expect(mockQuery.mock.calls[1][0]).toContain(`, true );`);
    expect(result).toEqual({ rowCount: 1 });
  });

  it("post_enfermedad restores a soft deleted disease", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ fue_borrado: true }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const { post_enfermedad } = require("../../../Enfermedades/enfermedades.repository");
    const result = await post_enfermedad({
      body: {
        nombre_enfermedad: encodeURIComponent("Rojas"),
        procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
        causa_erradicacion_enfermedad: false,
      },
    });

    expect(mockQuery.mock.calls[1][0]).toContain(`SET procedimiento_tratamiento_enfermedad='Tratamiento'`);
    expect(mockQuery.mock.calls[1][0]).toContain(`causa_erradicacion_enfermedad=false`);
    expect(mockQuery.mock.calls[1][0]).toContain(`fue_borrado=false`);
    expect(result).toEqual({ rowCount: 1 });
  });

  it("post_enfermedad returns undefined when the disease already exists and is active", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ fue_borrado: false }],
    });

    const { post_enfermedad } = require("../../../Enfermedades/enfermedades.repository");
    const result = await post_enfermedad({
      body: {
        nombre_enfermedad: encodeURIComponent("Rojas"),
        procedimiento_tratamiento_enfermedad: encodeURIComponent("Tratamiento"),
      },
    });

    expect(result).toBeUndefined();
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it("put_enfermedad updates the disease row", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { put_enfermedad } = require("../../../Enfermedades/enfermedades.repository");
    const result = await put_enfermedad({
      params: { nombre_enfermedad: "Vieja" },
      body: {
        nombre_enfermedad: "Nueva",
        procedimiento_tratamiento_enfermedad: "Tratamiento nuevo",
        causa_erradicacion_enfermedad: false,
      },
    });

    expect(mockQuery.mock.calls[0][0]).toContain(`nombre_enfermedad='Nueva'`);
    expect(mockQuery.mock.calls[0][0]).toContain(`causa_erradicacion_enfermedad=false`);
    expect(result).toBe(true);
  });
});
