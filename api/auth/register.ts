import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerAccount } from '../../serverless/auth.js';
import { connectToDatabase } from '../../serverless/database.js';
import { handleError, HttpError, methodNotAllowed, requestBody } from '../../serverless/http.js';

function validString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    await connectToDatabase();
    const { name, email, password } = requestBody(req);
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (
      !validString(name, 80) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof password !== 'string' || password.length < 10 || password.length > 200
    ) {
      throw new HttpError(400, 'Ingresa un nombre, correo válido y una contraseña de al menos 10 caracteres.');
    }
    const user = await registerAccount(name.trim(), normalizedEmail, password, res);
    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
}
