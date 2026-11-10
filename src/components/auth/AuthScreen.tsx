import React, { useState } from 'react';
import { Cloud, LockKeyhole } from 'lucide-react';
import { useBetApp } from '../../context/BetAppContext';
import { getLegacyBets } from '../../api';

export const AuthScreen: React.FC = () => {
  const { login, register, authError } = useBetApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [importLegacyBets, setImportLegacyBets] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasLegacyBets = getLegacyBets().length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await register({ name, email, password }, importLegacyBets);
      } else {
        await login({ email, password });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo completar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          {isRegistering ? <Cloud className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}
        </div>
        <h1 className="text-center text-xl font-bold">
          {isRegistering ? 'Crear cuenta BetStats' : 'Iniciar sesión'}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Tus apuestas se guardarán en la nube y estarán disponibles en tus dispositivos.
        </p>

        {(authError || error) && (
          <div role="alert" className="mt-5 rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
            {error || authError}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {isRegistering && (
            <label className="block text-sm text-slate-300">
              Nombre
              <input
                autoComplete="name"
                required
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
              />
            </label>
          )}
          <label className="block text-sm text-slate-300">
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Contraseña
            <input
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={isRegistering ? 10 : undefined}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-emerald-500"
            />
            {isRegistering && <span className="mt-1 block text-xs text-slate-500">Mínimo 10 caracteres.</span>}
          </label>
          {isRegistering && hasLegacyBets && (
            <label className="flex items-start gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={importLegacyBets}
                onChange={(event) => setImportLegacyBets(event.target.checked)}
                className="mt-0.5 accent-emerald-400"
              />
              Importar a esta cuenta las apuestas guardadas anteriormente en este dispositivo.
            </label>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Conectando…' : isRegistering ? 'Crear cuenta' : 'Entrar'}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          {isRegistering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="font-medium text-emerald-400 hover:text-emerald-300"
          >
            {isRegistering ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </form>
    </main>
  );
};
