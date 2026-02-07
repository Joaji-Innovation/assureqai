'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect if already logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.username || !formData.password) {
      setError('Credentials missing.');
      setIsLoading(false);
      return;
    }

    try {
      const { accessToken } = await authApi.login(formData);

      // Save token for client-side usage (components/hooks)
      localStorage.setItem('authToken', accessToken);

      setIsSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication Failed');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black selection:bg-primary/20 overflow-hidden flex flex-col">
      <main className="flex-1 pt-32 pb-16 min-h-screen flex flex-col items-center justify-center relative z-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content & Status */}
            <div className="space-y-8 order-2 lg:order-1">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 mb-6">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">
                    Admin Access
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 dark:text-white mb-6">
                  Super Admin <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 dark:from-indigo-400 dark:via-purple-400 dark:to-rose-400">
                    Control Center.
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                  Authenticate to manage tenants, view global statistics, and configure platform settings.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  'Platform-wide administration',
                  'Tenant provisioning & management',
                  'Global API key management',
                  'System health monitoring',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-neutral-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: The Holographic Terminal (Login Form) */}
            <div className="relative w-full rounded-3xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 flex flex-col overflow-hidden group backdrop-blur-xl shadow-xl dark:shadow-2xl order-1 lg:order-2">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  </div>
                  <div className="h-4 w-[1px] bg-neutral-200 dark:bg-white/10 mx-2" />
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-white/40 tracking-widest uppercase">
                    Root Access // Restricted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">SECURE</span>
                </div>
              </div>

              {/* Scanline & Grid Background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
              </div>

              {/* Form Content */}
              <div className="relative z-10 p-8 flex-1">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    {/* Username Field */}
                    <div className="group/input relative">
                      <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                        Admin // Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="w-full bg-neutral-50 dark:bg-black/40 border-b border-neutral-200 dark:border-white/10 rounded-t-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/20 font-mono"
                        placeholder="admin"
                      />
                      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
                    </div>

                    {/* Password Field */}
                    <div className="group/input relative">
                      <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                        Key // Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full bg-neutral-50 dark:bg-black/40 border-b border-neutral-200 dark:border-white/10 rounded-t-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/20 font-mono tracking-widest"
                        placeholder="••••••••••••"
                      />
                      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-mono text-center animate-pulse">
                      ! {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || isSuccess}
                    className={cn(
                      'group/btn relative w-full h-14 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
                      <span>
                        {isLoading ? 'Verifying...' : isSuccess ? 'Access Granted' : 'Authorize Session'}
                      </span>
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {!isLoading && !isSuccess && (
                        <div className="w-2 h-2 border-t-2 border-r-2 border-emerald-400 transform rotate-45 group-hover/btn:translate-x-1 transition-transform" />
                      )}
                      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </div>

                    {/* Button Scan Effect */}
                    {!isLoading && !isSuccess && (
                      <div className="absolute inset-0 bg-emerald-500/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="text-[10px] text-neutral-500 dark:text-white/40 font-mono uppercase tracking-widest hover:text-emerald-500 transition-colors"
                    >
                      Reset Credentials
                    </button>
                  </div>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/5 flex justify-center gap-4 text-[10px] text-neutral-400 dark:text-white/30 font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Admin Level 0
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> 2FA Required
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
