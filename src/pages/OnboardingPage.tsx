import { useState } from "react";
import { Home, Users, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { createFamily, joinFamilyByCode } from "@/services/authService";

interface OnboardingPageProps {
  onDone: () => void;
}

export function OnboardingPage({ onDone }: OnboardingPageProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [fullName, setFullName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { invite_code } = await createFamily(familyName, fullName);
      setCreatedCode(invite_code);
    } catch (err: any) {
      setError(err.message ?? "Não foi possível criar a família.");
    } finally {
      setLoading(false);
    }
  }

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
            Crie uma família nova ou entre em uma já existente.
          </p>
        </div>

        {createdCode ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Família criada! Compartilhe este código com os demais membros:
            </p>
            <p className="text-2xl font-mono font-semibold tracking-widest text-sage-600 bg-sage-50 dark:bg-sage-600/20 rounded-xl py-3">
              {createdCode}
            </p>
            <button
              onClick={onDone}
              className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 text-white font-medium py-2.5 text-sm"
            >
              Ir para o Dashboard
            </button>
          </div>
        ) : mode === "choose" ? (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium hover:border-sage-400 hover:bg-sage-50 dark:hover:bg-sage-600/10"
            >
              <PlusCircle className="h-5 w-5 text-sage-500" />
              Criar uma nova família
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium hover:border-sage-400 hover:bg-sage-50 dark:hover:bg-sage-600/10"
            >
              <Users className="h-5 w-5 text-terracotta-500" />
              Entrar com código de convite
            </button>
          </div>
        ) : (
          <form onSubmit={mode === "create" ? handleCreate : handleJoin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Seu nome</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
              />
            </div>

            {mode === "create" ? (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Nome da família
                </label>
                <input
                  required
                  placeholder="Ex: Família Silva"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Código de convite
                </label>
                <input
                  required
                  placeholder="Ex: a1b2c3d4"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
                />
              </div>
            )}

            {error && <p className="text-sm text-terracotta-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-medium py-2.5 text-sm"
            >
              {loading ? "Aguarde..." : mode === "create" ? "Criar família" : "Entrar"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="w-full text-center text-sm text-slate-400 hover:text-sage-600"
            >
              Voltar
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
