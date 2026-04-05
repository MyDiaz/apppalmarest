const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
  })),
}));

describe("autenticacion/util DB helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue({
      query: mockQuery,
      release: mockRelease,
    });
  });

  it("get_usuario queries the user and returns the first row", async () => {
    mockQuery.mockResolvedValue({
      rows: [{ cc_usuario: "123", rol: "admin" }],
    });

    const { get_usuario } = require("../../../autenticacion/util");

    const result = await get_usuario("123");

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith(
      `SELECT * FROM "USUARIO" WHERE cc_usuario = '123';`
    );
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ cc_usuario: "123", rol: "admin" });
  });
});
