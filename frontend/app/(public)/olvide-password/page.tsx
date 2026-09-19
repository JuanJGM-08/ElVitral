'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo procesar la solicitud');
      }

      setMessage(data.message || 'Revisa tu correo para continuar.');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-4 py-12 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.2),transparent_30%)] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/85 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">¿Olvidaste tu contraseña?</h1>
            <p className="mt-2 text-sm text-slate-600">Ingresa tu correo y te enviaremos instrucciones para recuperarla.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="tu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <Link href="/login" className="font-semibold text-primary hover:text-secondary">Volver al inicio de sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
