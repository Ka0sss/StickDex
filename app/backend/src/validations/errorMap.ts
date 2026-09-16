import { z } from 'zod'

const TYPE_NAMES: Record<string, string> = {
  string: 'texto',
  number: 'número',
  integer: 'número entero',
  boolean: 'booleano',
  bigint: 'entero grande',
  date: 'fecha',
  array: 'lista',
  object: 'objeto',
  null: 'nulo',
  undefined: 'ningún valor',
  nan: 'número inválido',
}

const STRING_VALIDATIONS: Record<string, string> = {
  email: 'Email inválido',
  url: 'URL inválida',
  uuid: 'UUID inválido',
  regex: 'El formato no es válido',
  datetime: 'Fecha y hora inválidas',
}

/**
 * Traduce los mensajes de Zod al español conservando códigos y rutas.
 * Importar este módulo registra el mapa de forma global.
 */
export const spanishErrorMap: z.ZodErrorMap = (issue) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type: {
      const expected = TYPE_NAMES[issue.expected] ?? issue.expected
      const received = TYPE_NAMES[issue.received] ?? issue.received
      return { message: `Se esperaba ${expected} y se recibió ${received}` }
    }
    case z.ZodIssueCode.too_small: {
      if (issue.type === 'string') {
        return issue.minimum > 0
          ? { message: `Debe tener al menos ${issue.minimum} caracteres` }
          : { message: 'Este campo es obligatorio' }
      }
      if (issue.type === 'array')
        return { message: `Debe contener al menos ${issue.minimum} elementos` }
      if (issue.type === 'number') {
        return {
          message: issue.inclusive
            ? `El valor debe ser mayor o igual a ${issue.minimum}`
            : `El valor debe ser mayor que ${issue.minimum}`,
        }
      }
      if (issue.type === 'date') return { message: 'La fecha es demasiado antigua' }
      return { message: 'El valor es demasiado pequeño' }
    }
    case z.ZodIssueCode.too_big: {
      if (issue.type === 'string')
        return { message: `No puede superar ${issue.maximum} caracteres` }
      if (issue.type === 'array')
        return { message: `No puede contener más de ${issue.maximum} elementos` }
      if (issue.type === 'number') return { message: `El valor no puede superar ${issue.maximum}` }
      if (issue.type === 'date') return { message: 'La fecha es demasiado reciente' }
      return { message: 'El valor es demasiado grande' }
    }
    case z.ZodIssueCode.invalid_string: {
      const validation =
        typeof issue.validation === 'string' ? issue.validation : Object.keys(issue.validation)[0]
      return { message: STRING_VALIDATIONS[validation] ?? 'El formato no es válido' }
    }
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor no permitido. Opciones: ${issue.options.join(', ')}` }
    case z.ZodIssueCode.invalid_date:
      return { message: 'Fecha inválida' }
    case z.ZodIssueCode.invalid_union:
      return { message: 'El valor no coincide con ninguno de los formatos permitidos' }
    case z.ZodIssueCode.invalid_literal:
      return { message: `El valor debe ser ${JSON.stringify(issue.expected)}` }
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campos no permitidos: ${issue.keys.join(', ')}` }
    case z.ZodIssueCode.custom:
      return { message: issue.message ?? 'Valor inválido' }
    default:
      return { message: issue.message ?? 'Entrada inválida' }
  }
}

z.setErrorMap(spanishErrorMap)
