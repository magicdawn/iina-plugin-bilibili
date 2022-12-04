declare namespace IINA {
  namespace API {
    interface Console {
      log(message: any, ...values: any[]): void
      warn(message: any, ...values: any[]): void
      error(message: any, ...values: any[]): void
    }
  }

  export type FileItem = ReturnType<IINA.API.File['list']>
}
