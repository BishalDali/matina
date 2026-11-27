import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@matina.clo');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone/50 p-4">
      <div className="w-full max-w-md border border-stone bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-[0.2em] text-charcoal">MATINA</h1>
        <p className="mt-1 text-sm text-charcoal/60">Sign in to the Admin Dashboard</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase tracking-widest text-ivory hover:opacity-90"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
