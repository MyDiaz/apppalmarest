const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();
const mockHash = jest.fn(() => "HASHED_PASSWORD");

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

jest.mock("../../../autenticacion/util", () => ({
  encriptar_clave: mockHash,
}));

describe("autenticacion/registro DB helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
    mockQuery.mockResolvedValue({ rowCount: 1 });
  });

  it("consulta_registrar builds the insert query and releases the client", async () => {
    const { consulta_registrar } = require("../../../autenticacion/registro.repository");

    await consulta_registrar({
      body: {
        cc_usuario: "123",
        nombre_usuario: encodeURIComponent("Ana Perez"),
        cargo_empresa: encodeURIComponent("Supervisor"),
        contrasena_usuario: encodeURIComponent("ClaveSegura#2026"),
      },
    });

    expect(mockHash).toHaveBeenCalledWith("ClaveSegura#2026");
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][0]).toContain(`VALUES ('123'`);
    expect(mockQuery.mock.calls[0][0]).toContain(`'Ana Perez'`);
    expect(mockQuery.mock.calls[0][0]).toContain(`'Supervisor'`);
    expect(mockQuery.mock.calls[0][0]).toContain(`'HASHED_PASSWORD'`);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
