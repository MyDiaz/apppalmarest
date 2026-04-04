const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

jest.mock("../../../Enfermedades/enfermedades.repository", () => ({
  get_enfermedad: jest.fn(),
}));

describe("Enfermedades etapas repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("get_enfermedades_con_etapas queries joined active rows", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id_etapa_enfermedad: 1 }] });

    const { get_enfermedades_con_etapas } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    const result = await get_enfermedades_con_etapas();

    expect(mockQuery.mock.calls[0][0]).toContain(`select * from "ETAPAS_ENFERMEDAD"`);
    expect(result).toEqual({ rows: [{ id_etapa_enfermedad: 1 }] });
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("get_enfermedad_con_etapas returns the rows array", async () => {
    mockQuery.mockResolvedValue({ rows: [{ id_etapa_enfermedad: 7 }] });

    const { get_enfermedad_con_etapas } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    const result = await get_enfermedad_con_etapas("Anillo rojo");

    expect(mockQuery.mock.calls[0][0]).toContain(`where nombre_enfermedad = 'Anillo rojo'`);
    expect(result).toEqual([{ id_etapa_enfermedad: 7 }]);
  });

  it("post_etapa_enfermedad inserts a stage", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { post_etapa_enfermedad } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    const result = await post_etapa_enfermedad("Etapa 1", "Anillo rojo", "Tratamiento 1");

    expect(mockQuery.mock.calls[0][0]).toContain(`INSERT INTO public."ETAPAS_ENFERMEDAD"`);
    expect(result).toEqual({ rowCount: 1 });
  });

  it("actualizar_etapa_enfermedad updates by id", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { actualizar_etapa_enfermedad } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    await actualizar_etapa_enfermedad(7, "Etapa editada", "Tratamiento editado");

    expect(mockQuery.mock.calls[0][0]).toContain(`WHERE id_etapa_enfermedad=7`);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it("eliminar_etapa_enfermedad soft deletes a stage", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { eliminar_etapa_enfermedad } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    await eliminar_etapa_enfermedad(9);

    expect(mockQuery.mock.calls[0][0]).toContain(`set fue_borrado = true`);
    expect(mockQuery.mock.calls[0][0]).toContain(`where id_etapa_enfermedad = '9'`);
  });

  it("actualizar_nombre_enfermedad updates the disease name", async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });

    const { actualizar_nombre_enfermedad } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    await actualizar_nombre_enfermedad("Nuevo nombre", "Viejo nombre");

    expect(mockQuery.mock.calls[0][0]).toContain(`nombre_enfermedad='Nuevo nombre'`);
    expect(mockQuery.mock.calls[0][0]).toContain(`WHERE nombre_enfermedad='Viejo nombre'`);
  });

  it("eliminar_enfermedad_con_etapas soft deletes disease and stages", async () => {
    mockQuery.mockResolvedValue({ rowCount: 2 });

    const { eliminar_enfermedad_con_etapas } = require("../../../Enfermedades/enfermedadesEtapas.repository");
    await eliminar_enfermedad_con_etapas("Anillo rojo");

    expect(mockQuery.mock.calls[0][0]).toContain(`UPDATE public."ENFERMEDAD"`);
    expect(mockQuery.mock.calls[0][0]).toContain(`UPDATE public."ETAPAS_ENFERMEDAD"`);
  });
});
