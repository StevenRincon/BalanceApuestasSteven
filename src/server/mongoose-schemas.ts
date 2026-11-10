/**
 * Modelos y Esquemas Mongoose para MongoDB Atlas
 * Estructura para despliegue en Next.js / Vercel
 */

export const MONGOOSE_SCHEMAS_CODE = `
import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Colección de Usuarios
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  bankrollGoal?: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  avatar: { type: String },
  bankrollGoal: { type: Number, default: 0 },
  currency: { type: String, default: 'COP' },
}, { timestamps: true });

UserSchema.index({ email: 1 });

// 2. Colección de Casas de Apuestas (Bookmakers)
export interface IBookmaker extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  website?: string;
  initialBalance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookmakerSchema = new Schema<IBookmaker>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#0284C7' },
  website: { type: String },
  initialBalance: { type: Number, default: 0 },
  notes: { type: String },
}, { timestamps: true });

BookmakerSchema.index({ userId: 1, name: 1 }, { unique: true });

// 3. Colección de Apuestas (Bets)
export interface IBet extends Document {
  userId: mongoose.Types.ObjectId;
  bookmakerId: mongoose.Types.ObjectId;
  bookmakerName: string;
  sport: string;
  competition: string;
  event: string;
  market: string;
  betType: 'SENCILLA' | 'COMBINADA' | 'SISTEMA' | 'EN_VIVO' | 'OTRA';
  odds: number;
  stake: number;
  potentialReturn: number;
  potentialProfit: number;
  status: 'PENDIENTE' | 'GANADA' | 'PERDIDA' | 'NULA' | 'REEMBOLSADA' | 'CASHOUT';
  actualReturn: number;
  netProfit: number;
  date: Date;
  settledDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BetSchema = new Schema<IBet>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookmakerId: { type: Schema.Types.ObjectId, ref: 'Bookmaker', required: true, index: true },
  bookmakerName: { type: String, required: true },
  sport: { type: String, required: true, index: true },
  competition: { type: String, required: true },
  event: { type: String, required: true },
  market: { type: String, required: true },
  betType: {
    type: String,
    enum: ['SENCILLA', 'COMBINADA', 'SISTEMA', 'EN_VIVO', 'OTRA'],
    default: 'SENCILLA'
  },
  odds: { type: Number, required: true, min: 1.01 },
  stake: { type: Number, required: true, min: 1 },
  potentialReturn: { type: Number, required: true },
  potentialProfit: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDIENTE', 'GANADA', 'PERDIDA', 'NULA', 'REEMBOLSADA', 'CASHOUT'],
    default: 'PENDIENTE',
    index: true
  },
  actualReturn: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  date: { type: Date, required: true, index: true },
  settledDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

BetSchema.index({ userId: 1, date: -1 });
BetSchema.index({ userId: 1, status: 1 });
BetSchema.index({ userId: 1, bookmakerId: 1 });
BetSchema.index({ userId: 1, sport: 1 });

// 4. Colección de Transacciones (Transactions - Depósitos / Retiros)
export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'DEPOSITO' | 'RETIRO' | 'BONO' | 'AJUSTE' | 'TRANSFERENCIA';
  bookmakerId: mongoose.Types.ObjectId;
  bookmakerName: string;
  destinationBookmakerId?: mongoose.Types.ObjectId;
  destinationBookmakerName?: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['DEPOSITO', 'RETIRO', 'BONO', 'AJUSTE', 'TRANSFERENCIA'],
    required: true,
    index: true
  },
  bookmakerId: { type: Schema.Types.ObjectId, ref: 'Bookmaker', required: true, index: true },
  bookmakerName: { type: String, required: true },
  destinationBookmakerId: { type: Schema.Types.ObjectId, ref: 'Bookmaker' },
  destinationBookmakerName: { type: String },
  amount: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true, index: true },
  paymentMethod: { type: String, required: true },
  reference: { type: String },
  notes: { type: String },
}, { timestamps: true });

TransactionSchema.index({ userId: 1, type: 1, date: -1 });

// 5. Colección de Gastos Adicionales (Expenses - Tipsters / Grupos VIP)
export interface IExpense extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: 'PRONOSTICOS' | 'APUESTAS_COMPRADAS' | 'GRUPO_VIP' | 'TELEGRAM' | 'WHATSAPP' | 'ESTRATEGIAS' | 'SOFTWARE' | 'OTRO';
  amount: number;
  date: Date;
  provider: string;
  duration: 'UNICO' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  expiryDate?: Date;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['PRONOSTICOS', 'APUESTAS_COMPRADAS', 'GRUPO_VIP', 'TELEGRAM', 'WHATSAPP', 'ESTRATEGIAS', 'SOFTWARE', 'OTRO'],
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true, index: true },
  provider: { type: String, required: true },
  duration: {
    type: String,
    enum: ['UNICO', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'],
    default: 'MENSUAL'
  },
  expiryDate: { type: Date },
  description: { type: String },
  notes: { type: String },
}, { timestamps: true });

ExpenseSchema.index({ userId: 1, date: -1 });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Bookmaker: Model<IBookmaker> = mongoose.models.Bookmaker || mongoose.model<IBookmaker>('Bookmaker', BookmakerSchema);
export const Bet: Model<IBet> = mongoose.models.Bet || mongoose.model<IBet>('Bet', BetSchema);
export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
`;
