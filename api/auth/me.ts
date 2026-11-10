import type { VercelRequest, VercelResponse } from '@vercel/node';
import { publicUser, requireAccount } from '../../serverless/auth';
import { handleError, methodNotAllowed } from '../../serverless/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    const account = await requireAccount(req);
    return res.status(200).json(publicUser(account));
  } catch (error) {
    return handleError(res, error);
  }
}
