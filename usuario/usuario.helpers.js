function scapePostgreSQL(str) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case '"':
      case "'":
      case "\\":
      case "%":
        return "\\" + char;
      default:
        return char;
    }
  });
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[,;_\-'#$%&/()=?Â¡Â¿!*])[A-Za-z\d,;_\-'#$%&/()=?Â¡Â¿!*]{8,}$/;

const validarContrasena = (contrasena) => {
  if (!passwordRegex.test(contrasena)) {
    return "La contraseÃ±a debe tener mÃ­nimo 8 caracteres, una mayÃºscula, una minÃºscula, un nÃºmero y un carÃ¡cter especial";
  }
};

module.exports = {
  scapePostgreSQL,
  validarContrasena,
};
