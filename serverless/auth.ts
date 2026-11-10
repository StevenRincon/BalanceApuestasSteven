import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { UserModel } from '../src/server/models.js';
import { connectToDatabase } from './database.js';
import { HttpError } from './http.js';

const scrypt = promisify(scryptCallback);
const cookieName = 'betstats_session';
const sessionDurationSeconds = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Configura AUTH_SECRET con al menos 32 caracteres en Vercel.');
  }
  return secret;
}

function setSessionCookie(res: VercelResponse, accountId: string) {
  const payload = Buffer.from(JSON.stringify({
    sub: accountId,
    exp: Math.floor(Date.now() / 1000) + sessionDurationSeconds,
  })).toString('base64url');
  const signature = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
  res.setHeader('Set-Cookie', `${cookieName}=${payload}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function getSessionAccountId(req: VercelRequest) {
  const cookie = req.headers.cookie
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!cookie) return null;

  const [payload, signature, extra] = cookie.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', getSessionSecret()).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      exp?: number;
    };
    if (!decoded.sub || !mongoose.isValidObjectId(decoded.sub) || !decoded.exp || decoded.exp <= Date.now() / 1000) {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

export async function requireAccount(req: VercelRequest) {
  await connectToDatabase();
  const accountId = getSessionAccountId(req);
  if (!accountId) throw new HttpError(401, 'Inicia sesión para continuar.');
  const account = await UserModel.findById(accountId).select('_id name email').lean();
  if (!account || Array.isArray(account)) {
    throw new HttpError(401, 'La sesión ya no es válida. Inicia sesión de nuevo.');
  }
  return {
    _id: new mongoose.Types.ObjectId(String(account._id)),
    name: String(account.name),
    email: String(account.email),
  };
}

export async function registerAccount(
  name: string,
  email: string,
  password: string,
  res: VercelResponse
) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  try {
    const account = await UserModel.create({
      name,
      email,
      passwordHash: `scrypt$${salt}$${hash.toString('hex')}`,
    });
    setSessionCookie(res, account._id.toString());
    return publicUser(account);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
    }
    throw error;
  }
}

export async function loginAccount(email: string, password: string, res: VercelResponse) {
  const account = await UserModel.findOne({ email });
  const storedHash = account?.passwordHash as string | undefined;
  const [, salt, expectedHash] = storedHash?.split('$') ?? [];
  if (!account || !salt || !expectedHash) throw new HttpError(401, 'Correo o contraseña incorrectos.');

  const actualHash = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHash, 'hex');
  if (actualHash.length !== expected.length || !timingSafeEqual(actualHash, expected)) {
    throw new HttpError(401, 'Correo o contraseña incorrectos.');
  }
  setSessionCookie(res, account._id.toString());
  return publicUser(account);
}

export function publicUser(account: { _id: { toString(): string }; name: string; email: string; createdAt?: Date }) {
  return {
    id: account._id.toString(),
    name: account.name,
    email: account.email,
    createdAt: account.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}
