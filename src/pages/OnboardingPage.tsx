import { useState } from "react";
import { Home } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { joinFamilyByCode } from "@/services/authService";

interface OnboardingPageProps {
  onDone: () => void;
}

export function OnboardingPage({ onDone }: OnboardingPageProps) {
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await joinFamilyByCode(inviteCode.trim(), fullName);
      onDone();
    } catch (err: any) {
      setError(err.message ?? "Código de convite inválido.");
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
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Bem-vindo(a)!</h1>
          <p className="text-sm text-slate-400 mt-1 text-center">
            Peça o código de convite pra quem administra a sua família no Gestão Família.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Seu nome</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Código de convite</label>
            <input
              required
              placeholder="Ex: a1b2c3d4"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
            />
          </div>

          {error && <p className="text-sm text-terracotta-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-medium py-2.5 text-sm"
          >
            {loading ? "Aguarde..." : "Entrar na família"}
          </button>
        </form>
      </Card>
    </div>
  );
}
