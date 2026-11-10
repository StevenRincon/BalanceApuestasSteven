/**
 * Esquemas de Validación Zod para Frontend y Backend (Next.js / Express)
 */

export const ZOD_SCHEMAS_CODE = `
import { z } from 'zod';

export const BetSchema = z.object({
  bookmakerId: z.string().min(1, 'Debe seleccionar una casa de apuestas'),
  bookmakerName: z.string().min(1, 'El nombre de la casa es requerido'),
  sport: z.string().min(1, 'Debe indicar el deporte'),
  competition: z.string().min(1, 'Debe indicar la competición o liga'),
  event: z.string().min(1, 'Debe indicar el partido o evento'),
  market: z.string().min(1, 'Debe describir el mercado o selección'),
  betType: z.enum(['SENCILLA', 'COMBINADA', 'SISTEMA', 'EN_VIVO', 'OTRA']),
  odds: z.number().min(1.01, 'La cuota decimal debe ser mayor a 1.00'),
  stake: z.number().positive('El valor invertido debe ser mayor a 0 COP'),
  status: z.enum(['PENDIENTE', 'GANADA', 'PERDIDA', 'NULA', 'REEMBOLSADA', 'CASHOUT']).default('PENDIENTE'),
  actualReturn: z.number().min(0).optional(),
  date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional(),
});

export const BookmakerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color hexadecimal inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  initialBalance: z.number().min(0, 'El saldo actual no puede ser negativo'),
  notes: z.string().optional(),
});

export const TransactionSchema = z.object({
  type: z.enum(['DEPOSITO', 'RETIRO', 'BONO', 'AJUSTE', 'TRANSFERENCIA']),
  bookmakerId: z.string().min(1, 'Debe seleccionar la casa de apuestas'),
  bookmakerName: z.string().min(1),
  destinationBookmakerId: z.string().optional(),
  destinationBookmakerName: z.string().optional(),
  amount: z.number().positive('El monto debe ser mayor a 0 COP'),
  date: z.string().min(1, 'La fecha es requerida'),
  paymentMethod: z.enum([
    'PSE', 'Nequi', 'Daviplata', 'Bancolombia', 'Tarjeta de Crédito', 
    'Tarjeta Débito', 'Efecty', 'SuRed / Baloto', 'Transferencia Bancaria', 'Efectivo', 'Otro'
  ]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const ExpenseSchema = z.object({
  title: z.string().min(2, 'El título del gasto es requerido'),
  category: z.enum([
    'PRONOSTICOS', 'APUESTAS_COMPRADAS', 'GRUPO_VIP', 'TELEGRAM', 
    'WHATSAPP', 'ESTRATEGIAS', 'SOFTWARE', 'OTRO'
  ]),
  amount: z.number().positive('El valor del gasto debe ser mayor a 0 COP'),
  date: z.string().min(1, 'La fecha de compra es requerida'),
  provider: z.string().min(1, 'El proveedor o tipster es requerido'),
  duration: z.enum(['UNICO', 'SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']),
  expiryDate: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});
`;

export const VERCEL_NEXTJS_ROUTES_CODE = `
// ==========================================
// lib/mongodb.ts (Conexión Singleton Mongoose para Vercel Serverless)
// ==========================================
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Por favor define la variable MONGODB_URI en .env.local');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// ==========================================
// app/api/bets/route.ts (Next.js App Router API Route)
// ==========================================
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Bet } from '@/models/Bet';
import { getServerSession } from 'next-auth'; // o tu solución de sesión

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const bookmakerId = searchParams.get('bookmakerId');

  const query: any = {};
  if (status && status !== 'ALL') query.status = status;
  if (bookmakerId && bookmakerId !== 'ALL') query.bookmakerId = bookmakerId;

  const bets = await Bet.find(query).sort({ date: -1 }).lean();
  return NextResponse.json(bets);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const body = await req.json();

  // Cálculo automático del retorno y ganancia potencial
  const potentialReturn = Math.round(body.stake * body.odds);
  const potentialProfit = Math.round(potentialReturn - body.stake);

  let actualReturn = 0;
  let netProfit = 0;

  if (body.status === 'GANADA') {
    actualReturn = potentialReturn;
    netProfit = potentialProfit;
  } else if (body.status === 'PERDIDA') {
    actualReturn = 0;
    netProfit = -body.stake;
  } else if (body.status === 'NULA' || body.status === 'REEMBOLSADA') {
    actualReturn = body.stake;
    netProfit = 0;
  } else if (body.status === 'CASHOUT') {
    actualReturn = body.actualReturn || 0;
    netProfit = actualReturn - body.stake;
  }

  const bet = await Bet.create({
    ...body,
    potentialReturn,
    potentialProfit,
    actualReturn,
    netProfit,
  });

  return NextResponse.json(bet, { status: 201 });
}
`;
