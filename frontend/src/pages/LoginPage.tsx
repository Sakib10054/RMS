
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChefHat,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  LockKeyhole,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = (
      location.state as { message?: string } | null
  )?.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 md:grid-cols-2">
          <section className="hidden flex-col justify-between bg-emerald-700 p-10 text-white md:flex">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <ChefHat size={28} />
              </div>
              <div>
                <p className="text-xl font-bold">
                  Restaurant<span className="text-emerald-200">OS</span>
                </p>
                <p className="text-xs text-emerald-100">Management System</p>
              </div>
            </div>

            <div className="py-12">
              <h1 className="text-4xl font-extrabold leading-tight">
                Welcome back to your restaurant workspace.
              </h1>
              <p className="mt-5 max-w-sm leading-7 text-emerald-100">
                Manage your operations, keep track of orders, and make every
                service run smoothly.
              </p>
              <div className="mt-10 flex items-center gap-3">
                <span className="h-2 w-8 rounded-full bg-white" />
                <span className="h-2 w-2 rounded-full bg-white/40" />
                <span className="h-2 w-2 rounded-full bg-white/40" />
              </div>
            </div>

            <p className="text-xs text-emerald-100">
              © {new Date().getFullYear()} RestaurantOS
            </p>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 flex items-center gap-3 md:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <ChefHat size={25} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Restaurant<span className="text-emerald-600">OS</span>
                  </p>
                  <p className="text-xs text-slate-500">Management System</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Sign in
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Enter your credentials to access your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {successMessage && (
                    <p
                        role="status"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                      {successMessage}
                    </p>
                )}

                <div>
                  <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        Signing in...
                      </>
                  ) : (
                      'Sign in'
                  )}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link
                    to="/register"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Create account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
  );
}