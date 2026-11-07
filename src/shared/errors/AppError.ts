// Erro previsto: código estável para o cliente e mensagem segura para exibir.
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
