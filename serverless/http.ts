import type { VercelRequest, VercelResponse } from '@vercel/node';

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export function methodNotAllowed(res: VercelResponse, methods: string[]) {
  res.setHeader('Allow', methods.join(', '));
  return res.status(405).json({ message: 'Método no permitido.' });
}

export function handleError(res: VercelResponse, error: unknown) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error('Error en API:', error);
  return res.status(500).json({ message: 'Error interno del servidor. Intenta de nuevo más tarde.' });
}

export function requestBody(req: VercelRequest): Record<string, unknown> {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new HttpError(400, 'El cuerpo de la solicitud no es válido.');
  }
  return req.body as Record<string, unknown>;
}
