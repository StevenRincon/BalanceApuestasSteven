import mongoose, { Schema } from 'mongoose';
import type { BetStatus, BetType } from '../types';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const betSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookmakerId: { type: String, required: true },
    bookmakerName: { type: String, required: true },
    sport: { type: String, required: true },
    competition: { type: String, required: true },
    event: { type: String, required: true },
    market: { type: String, required: true },
    betType: { type: String, enum: ['SENCILLA', 'COMBINADA', 'SISTEMA', 'EN_VIVO', 'OTRA'], required: true },
    odds: { type: Number, required: true, min: 1.01 },
    stake: { type: Number, required: true, min: 1 },
    potentialReturn: { type: Number, required: true },
    potentialProfit: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'NULA', 'REEMBOLSADA', 'CASHOUT'],
      required: true,
    },
    actualReturn: { type: Number, required: true, min: 0 },
    netProfit: { type: Number, required: true },
    date: { type: String, required: true },
    settledDate: { type: String },
    providerEventId: { type: String },
    providerEventDate: { type: String },
    providerLeagueId: { type: String },
    outcomeSelection: { type: String, enum: ['HOME', 'AWAY', 'DRAW'] },
    officialResult: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

betSchema.index({ userId: 1, date: -1 });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const BetModel = mongoose.models.Bet || mongoose.model('Bet', betSchema);

export interface BetInput {
  bookmakerId: string;
  bookmakerName: string;
  sport: string;
  competition: string;
  event: string;
  market: string;
  betType: BetType;
  odds: number;
  stake: number;
  status: BetStatus;
  actualReturn?: number;
  date: string;
  settledDate?: string;
  providerEventId?: string;
  providerEventDate?: string;
  providerLeagueId?: string;
  outcomeSelection?: 'HOME' | 'AWAY' | 'DRAW';
  officialResult?: string;
  notes?: string;
}
