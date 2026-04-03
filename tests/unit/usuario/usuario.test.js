const usuarioRouter = require("../../../usuario/usuario");

describe("usuario helpers", () => {
  describe("validarContrasena", () => {
    it("accepts a strong password", () => {
      expect(usuarioRouter.validarContrasena("ClaveSegura#2026")).toBeUndefined();
    });

    it("rejects a weak password", () => {
      expect(usuarioRouter.validarContrasena("abc123")).toEqual(
        expect.stringContaining("8 caracteres")
      );
    });
  });

  describe("scapePostgreSQL", () => {
    it("escapes quotes, backslashes, percent signs, and new lines", () => {
      expect(usuarioRouter.scapePostgreSQL("O'Reilly\\100%\n")).toBe(
        "O\\'Reilly\\\\100\\%\\n"
      );
    });
  });
});
