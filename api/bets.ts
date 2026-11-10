import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { BetModel } from '../src/server/models.js';
import { betFinancialFields, parseBetInput, serializeBet } from '../serverless/bets.js';
import { requireAccount } from '../serverless/auth.js';
import { handleError, HttpError, methodNotAllowed, requestBody } from '../serverless/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const account = await requireAccount(req);
    if (req.method === 'GET') {
      const bets = await BetModel.find({ userId: account._id }).sort({ date: -1, createdAt: -1 }).lean();
      return res.status(200).json(bets.map((bet) => serializeBet(bet as unknown as Record<string, unknown>)));
    }

    if (req.method === 'POST') {
      const input = parseBetInput(req.body);
      const bet = await BetModel.create({ ...input, ...betFinancialFields(input), userId: account._id });
      return res.status(201).json(serializeBet(bet.toObject() as unknown as Record<string, unknown>));
    }

    if (req.method === 'PUT') {
      const { bets } = requestBody(req);
      if (!Array.isArray(bets) || bets.length > 5000) {
        throw new HttpError(400, 'La lista de apuestas no es válida.');
      }
      const inputs = bets.map((bet) => parseBetInput(bet));
      const session = await mongoose.startSession();
      let inserted: mongoose.Document[] = [];
      try {
        await session.withTransaction(async () => {
          await BetModel.deleteMany({ userId: account._id }, { session });
          if (inputs.length) {
            inserted = await BetModel.create(
              inputs.map((input) => ({ ...input, ...betFinancialFields(input), userId: account._id })),
              { session }
            );
          } else {
            inserted = [];
          }
        });
      } finally {
        await session.endSession();
      }
      return res.status(200).json(inserted.map((bet) => serializeBet(bet.toObject() as unknown as Record<string, unknown>)));
    }

    if (req.method === 'DELETE') {
      await BetModel.deleteMany({ userId: account._id });
      return res.status(200).json({ success: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return handleError(res, error);
  }
}
