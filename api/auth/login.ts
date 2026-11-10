import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loginAccount } from '../../serverless/auth.js';
import { connectToDatabase } from '../../serverless/database.js';
import { handleError, HttpError, methodNotAllowed, requestBody } from '../../serverless/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    await connectToDatabase();
    const { email, password } = requestBody(req);
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim()) {
      throw new HttpError(400, 'Ingresa tu correo y contraseña.');
    }
    const user = await loginAccount(email.trim().toLowerCase(), password, res);
    return res.status(200).json(user);
  } catch (error) {
    return handleError(res, error);
  }
}
