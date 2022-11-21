function errorHandler(error, req, res, _) {
  console.log(error.name)
  console.log("__________________________")
  console.log(error)

  const errors = {
    //my errors
    // estos son los errores creados por mi dependiendo de la accion que realize el usuario

    //empty data
    EMPTY_PASSWORD: () => res.status(401).json({ error: "necesita proporcionar su contraseña para poder hacer la accion" }),
    EMPTY_EMAIL: () => res.status(401).json({ error: "necesita proporcionar su email para poder hacer la accion" }),
    EMPTY_DATA: () => res.status(401).json({ error: "necesita proporcionar todos los datos requeridos para poder hacer la accion" }),
    //invalid data
    INVALID_PASSWORD: () => res.status(401).json({ error: "la contraseña proporcionado no es valida, verifique si hay algo erroneo en la ecritura del mismo" }),
    INVALID_LOGIN_PASSWORD: () => res.status(401).json({ error: "algun dato proporcionado no es valido, verifique si hay algo erroneo en la ecritura del mismo" }),
    INVALID_TOKEN: () => res.status(401).json({ error: "el token proporcionado por el cliente no es vaido" }),
    INVALID_AUTHCODE: () => res.status(401).json({ error: "authenticacion incorrecta" }),
    SHORT_LENGTH: () => res.status(401).json({ error: "la contraceña debe poseer un minimo de 8 caracteres" }),
    INVALID_ID: () => res.status(400).json({ error: "el elemento ya ha sido eliminado" }),
    INVALID_DATA: () => res.status(400).json({ error: "la plataforma no soporta este tipo de archivos" }),
    INVALID_INPUT: () => res.status(400).json({ error: "ya existe un usuario con ese gmail" }),
    MulterError: () => res.status(400).json({ error: "el elemento que decea subir es demaciado pesado" }),

    //UNAUTURIZED
    UNAUTURIZED: () => res.status(401).json({ error: "no tienes los permisos necesarios para realizar esta accion" }),
    //mongoose errors
    CastError: () => res.status(500).json({ error: "ha ocurrido un error debido a un fallo de la plataforma, por favor reporte este error a uno de los tecnicos de la misma para poder analizarlo y solucionarlo, [ID ERRROR / CastError]" }),
    DEFAULT_ERROR: () => res.status(500)
  }

  return typeof errors[error.name]
    ? errors[error.name]()
    : errors["DEFAULT_ERROR"]()
}

module.exports = errorHandler