import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie } from '../../serverless/auth.js';
import { handleError, methodNotAllowed } from '../../serverless/http.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}
