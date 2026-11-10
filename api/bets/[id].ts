import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { BetModel } from '../../src/server/models.js';
import { betFinancialFields, parseBetInput, serializeBet } from '../../serverless/bets.js';
import { requireAccount } from '../../serverless/auth.js';
import { handleError, HttpError, methodNotAllowed } from '../../serverless/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const account = await requireAccount(req);
    const id = req.query.id;
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      throw new HttpError(404, 'No se encontró la apuesta.');
    }

    if (req.method === 'PUT') {
      const bet = await BetModel.findOne({ _id: id, userId: account._id });
      if (!bet) throw new HttpError(404, 'No se encontró la apuesta.');
      const input = parseBetInput(req.body, bet.toObject());
      Object.assign(bet, input, betFinancialFields(input), { updatedAt: new Date() });
      await bet.save();
      return res.status(200).json(serializeBet(bet.toObject() as unknown as Record<string, unknown>));
    }

    if (req.method === 'DELETE') {
      const result = await BetModel.deleteOne({ _id: id, userId: account._id });
      if (!result.deletedCount) throw new HttpError(404, 'No se encontró la apuesta.');
      return res.status(200).json({ success: true });
    }

    return methodNotAllowed(res, ['PUT', 'DELETE']);
  } catch (error) {
    return handleError(res, error);
  }
}
