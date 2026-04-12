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
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
