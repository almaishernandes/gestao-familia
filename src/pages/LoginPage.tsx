import { useState } from "react";
import { Home, Eye, EyeOff } from "lucide-react";
import { signIn, signUp } from "@/services/authService";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSignupDone(true);
      }
    } catch (err: any) {
      setError(err.message ?? "Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sage-50 to-slate-50 dark:from-slate-900 dark:to-slate-900 p-4">
      <Card className="w-full max-w-sm p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl2 bg-sage-500 flex items-center justify-center mb-3 shadow-sm">
            <Home className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Gestão Família</h1>
          <p className="text-sm text-slate-400 mt-1">Organize, conecte e proteja sua família</p>
        </div>

        {signupDone ? (
          <p className="text-sm text-center text-sage-600">
            Conta criada! Verifique seu e-mail para confirmar e depois faça login.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700 mb-6">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition-colors",
                  mode === "login"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition-colors",
                  mode === "signup"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                )}
              >
                Cadastrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Senha</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-sage-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-terracotta-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-medium py-2.5 text-sm shadow-sm"
              >
                {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
