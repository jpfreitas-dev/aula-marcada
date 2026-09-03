import axios from 'axios';

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requisição inválida.',
  401: 'Não autorizado.',
  403: 'Acesso negado.',
  404: 'Recurso não encontrado.',
  409: 'Conflito ao processar a solicitação.',
  422: 'Dados inválidos.',
  500: 'Erro interno do servidor.',
  502: 'Serviço indisponível. Tente novamente.',
  503: 'Serviço indisponível. Tente novamente.',
};

function isAxiosEnglishMessage(message: string): boolean {
  return /^request failed with status code \d+$/i.test(message);
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado.',
): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.length > 0) {
      return responseMessage;
    }

    const status = error.response?.status;
    if (status !== undefined && STATUS_MESSAGES[status]) {
      return STATUS_MESSAGES[status];
    }

    if (
      error.message &&
      !isAxiosEnglishMessage(error.message) &&
      error.message !== 'Network Error'
    ) {
      return error.message;
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    if (isAxiosEnglishMessage(error.message)) {
      return fallback;
    }

    return error.message;
  }

  return fallback;
}

export class ApiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function toApiRequestError(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado.',
): ApiRequestError {
  return new ApiRequestError(getApiErrorMessage(error, fallback));
}
