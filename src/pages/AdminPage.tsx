import { useEffect, useState, useCallback } from "react";
import { Home, Plus, Copy, Share2, Users, ShieldAlert, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { ToastHost } from "@/components/shared/ToastHost";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import { useSession } from "@/hooks/useSession";
import { LoginPage } from "@/pages/LoginPage";
import * as adminService from "@/services/adminService";
import { signOut } from "@/services/authService";
import type { AdminFamilyRow, SubscriptionStatus } from "@/services/adminService";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Em teste",
  ativa: "Em dia",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  trial: "bg-sky-50 text-sky-600 dark:bg-sky-600/20 dark:text-sky-400",
  ativa: "bg-sage-50 text-sage-600 dark:bg-sage-600/20 dark:text-sage-400",
  atrasada: "bg-amber-50 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400",
  cancelada: "bg-terracotta-50 text-terracotta-500 dark:bg-terracotta-600/20 dark:text-terracotta-400",
};

function SubscriptionModal({
  family,
  open,
  onClose,
  onSaved,
}: {
  family: AdminFamilyRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>("trial");
  const [price, setPrice] = useState("");
  const [nextDueAt, setNextDueAt] = useState("");
  const [lastPaymentAt, setLastPaymentAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!family) return;
    setStatus(family.subscriptionStatus);
    setPrice(family.subscriptionPrice != null ? String(family.subscriptionPrice) : "");
    setNextDueAt(family.nextDueAt ?? "");
    setLastPaymentAt(family.lastPaymentAt ?? "");
    setNotes(family.paymentNotes ?? "");
  }, [family]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!family) return;
    setLoading(true);
    try {
      await adminService.adminUpdateSubscription(
        family.id,
        status,
        price ? Number(price) : null,
        nextDueAt || null,
        lastPaymentAt || null,
        notes || null
      );
      toastSuccess("Assinatura atualizada.");
      onSaved();
      onClose();
    } catch {
      toastError("Não foi possível atualizar a assinatura.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Assinatura — ${family?.name ?? ""}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}>
          <option value="trial">Em teste</option>
          <option value="ativa">Em dia</option>
          <option value="atrasada">Atrasada</option>
          <option value="cancelada">Cancelada</option>
        </SelectField>
        <TextField label="Valor mensal (R$)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Próximo vencimento" type="date" value={nextDueAt} onChange={(e) => setNextDueAt(e.target.value)} />
          <TextField label="Último pagamento" type="date" value={lastPaymentAt} onChange={(e) => setLastPaymentAt(e.target.value)} />
        </div>
        <TextField label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function NewFamilyModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteCode: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const created = await adminService.adminCreateFamily(name.trim());
      setResult({ inviteCode: created.inviteCode });
      onCreated();
    } catch {
      toastError("Não foi possível criar a família.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setResult(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Cadastrar nova família">
      {result ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Família criada! Entregue este código de convite ao responsável — ele cria a própria conta e usa o código
            para entrar.
          </p>
          <p className="text-2xl font-mono font-semibold tracking-widest text-sage-600 bg-sage-50 dark:bg-sage-600/20 rounded-xl py-3">
            {result.inviteCode}
          </p>
          <PrimaryButton onClick={handleClose}>Concluir</PrimaryButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Nome da família"
            required
            placeholder="Ex: Família Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar família"}
          </PrimaryButton>
        </form>
      )}
    </Modal>
  );
}

function DeleteFamilyModal({
  family,
  open,
  onClose,
  onDeleted,
}: {
  family: AdminFamilyRow | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConfirmText("");
  }, [family]);

  async function handleDelete() {
    if (!family) return;
    setLoading(true);
    try {
      await adminService.adminDeleteFamily(family.id);
      toastSuccess("Família excluída.");
      onDeleted();
      onClose();
    } catch {
      toastError("Não foi possível excluir a família.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Excluir família">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Isso apaga <strong>permanentemente</strong> a família <strong>{family?.name}</strong> e tudo que pertence a
          ela — listas de compras, viagens, posts, documentos, tudo. Não tem como desfazer.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Digite <strong>{family?.name}</strong> abaixo para confirmar.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-terracotta-400"
        />
        <button
          onClick={handleDelete}
          disabled={loading || confirmText !== family?.name}
          className="w-full rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-40 text-white font-medium py-2.5 text-sm"
        >
          {loading ? "Excluindo..." : "Excluir permanentemente"}
        </button>
      </div>
    </Modal>
  );
}

function AdminDashboard() {
  const [families, setFamilies] = useState<AdminFamilyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subscriptionTarget, setSubscriptionTarget] = useState<AdminFamilyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminFamilyRow | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setFamilies(await adminService.fetchAllFamilies());
    } catch {
      toastError("Não foi possível carregar as famílias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toastSuccess("Código copiado!");
  }

  function shareCode(name: string, code: string) {
    const text = `Olá! Sua família "${name}" já pode usar o Gestão Família 🏠\nCrie sua conta em https://familia.institutohernandes.org e use este código de convite: ${code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const filtered = families.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  const totalMembers = families.reduce((sum, f) => sum + f.memberCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl2 bg-sage-500 flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-slate-900 dark:text-white">
              Gestão Família <span className="text-slate-400 font-sans text-sm font-normal">/ admin</span>
            </span>
          </div>
          <button onClick={() => signOut()} className="text-sm text-slate-400 hover:text-slate-600">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Famílias cadastradas</h1>
            <p className="text-sm text-slate-400 mt-1">
              {families.length} família{families.length !== 1 ? "s" : ""} · {totalMembers} membro{totalMembers !== 1 ? "s" : ""} no total
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
          >
            <Plus className="h-4 w-4" />
            Nova família
          </button>
        </div>

        <input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
        />

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-left text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">Família</th>
                <th className="px-5 py-3 font-medium">Membros</th>
                <th className="px-5 py-3 font-medium">Assinatura</th>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Criada em</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{f.name}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {f.memberCount}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSubscriptionTarget(f)}
                      className={cn("text-xs font-medium rounded-full px-2.5 py-1 hover:opacity-80", STATUS_COLOR[f.subscriptionStatus])}
                    >
                      {STATUS_LABEL[f.subscriptionStatus]}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-slate-50 dark:bg-slate-700 rounded px-2 py-1">{f.inviteCode}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {format(new Date(f.createdAt), "d MMM yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => copyCode(f.inviteCode)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => shareCode(f.name, f.inviteCode)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Share2 className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => setDeleteTarget(f)} className="p-1.5 rounded-lg hover:bg-terracotta-50 dark:hover:bg-terracotta-600/20">
                        <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-terracotta-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">Nenhuma família encontrada.</p>
          )}
        </Card>
      </main>

      <NewFamilyModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
      <SubscriptionModal
        family={subscriptionTarget}
        open={!!subscriptionTarget}
        onClose={() => setSubscriptionTarget(null)}
        onSaved={reload}
      />
      <DeleteFamilyModal
        family={deleteTarget}
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={reload}
      />
      <ToastHost />
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 p-4 text-center">
      <ShieldAlert className="h-10 w-10 text-terracotta-500" />
      <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Acesso restrito</h1>
      <p className="text-sm text-slate-400 max-w-sm">
        Essa conta não tem permissão de administrador da plataforma. Fale com o responsável pelo Instituto Hernandes
        se acha que isso é um engano.
      </p>
      <button onClick={() => signOut()} className="text-sm text-sage-600 font-medium mt-2">
        Sair e entrar com outra conta
      </button>
    </div>
  );
}

export function AdminPage() {
  const { session, loading: sessionLoading } = useSession();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session) {
      setChecking(false);
      return;
    }
    adminService
      .checkIsPlatformAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false));
  }, [session]);

  if (sessionLoading || (session && checking)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    );
  }

  if (!session) return <LoginPage />;
  if (!isAdmin) return <NotAuthorized />;
  return <AdminDashboard />;
}
