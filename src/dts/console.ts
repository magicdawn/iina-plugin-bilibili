import { format } from 'util'

export const console: IINA.API.Console = {
  log(msg: string, ...values: any[]) {
    return iina.console.log(format(msg, ...values))
  },
  warn(msg: string, ...values: any[]) {
    return iina.console.warn(format(msg, ...values))
  },
  error(msg: string, ...values: any[]) {
    return iina.console.error(format(msg, ...values))
  },
}

// attach to global
;(global as any).console = console
declare global {
  export const console: IINA.API.Console
}
