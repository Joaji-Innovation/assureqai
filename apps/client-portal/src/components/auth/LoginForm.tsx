"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clientStoreToken } from "../../lib/clientAuthService";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.username || !formData.password) {
      setError("Credentials missing.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        clientStoreToken(data.token, data.user);
        toast({
          title: "Access Granted",
          description: "Welcome back, verified user.",
          className: "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
        });
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setError(data.error || "Authentication Failed");
        toast({
          title: "Access Denied",
          description: data.error || "Invalid credentials.",
          variant: "destructive",
        });
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      setError("Connection Error");
      toast({
        title: "Network Failure",
        description: "Unable to reach auth server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Username Field */}
        <div className="group/input relative">
            <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                Identity // Username
            </label>
            <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-neutral-50 dark:bg-black/40 border-b border-neutral-200 dark:border-white/10 rounded-t-lg px-4 py-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:bg-emerald-500/5 transition-all placeholder:text-neutral-400 dark:placeholder:text-white/20 font-mono"
                placeholder="Enter verified ID..."
            />
            <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-emerald-500 group-focus-within/input:w-full transition-all duration-500" />
        </div>

        {/* Password Field */}
        <div className="group/input relative">
            <label className="text-[10px] font-mono text-emerald-500/70 mb-1.5 block uppercase tracking-wider group-focus-within/input:text-emerald-400 transition-colors">
                Security // Password
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
            "group/btn relative w-full h-14 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
            error && "shake"
          )}
      >
          <div className="absolute inset-0 flex items-center justify-center gap-2 z-10">
              <span>
                {isLoading ? "Authenticating..." : 
                 isSuccess ? "Access Granted" : 
                 "Initiate Uplink"}
              </span>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {!isLoading && !isSuccess && <div className="w-2 h-2 border-t-2 border-r-2 border-emerald-400 transform rotate-45 group-hover/btn:translate-x-1 transition-transform" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
          
          {/* Button Scan Effect */}
          {!isLoading && !isSuccess && <div className="absolute inset-0 bg-emerald-500/20 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />}
      </button>

      <div className="text-center">
         <button type="button" className="text-[10px] text-neutral-500 dark:text-white/40 font-mono uppercase tracking-widest hover:text-emerald-500 transition-colors">
             Recover Access Keys
         </button>
      </div>
    </form>
  );
}
