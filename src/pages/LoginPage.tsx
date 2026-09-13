import { useState } from "react";
import { Home } from "lucide-react";
import { signIn, signUp } from "@/services/authService";
import { Card } from "@/components/ui/Card";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl2 bg-sage-500 flex items-center justify-center mb-3">
            <Home className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Gestão Família</h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {signupDone ? (
          <p className="text-sm text-center text-sage-600">
            Conta criada! Verifique seu e-mail para confirmar e depois faça login.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>

            {error && <p className="text-sm text-terracotta-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-medium py-2.5 text-sm"
            >
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        )}

        {!signupDone && (
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 w-full text-center text-sm text-slate-400 hover:text-sage-600"
          >
            {mode === "login" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
          </button>
        )}
      </Card>
    </div>
  );
}
