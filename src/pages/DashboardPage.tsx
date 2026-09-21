import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Crown, User, Shield, ChevronRight, Copy, Share2, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { TextField, PrimaryButton } from "@/components/ui/Field";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as familyService from "@/services/familyService";
import type { ProfileDetails } from "@/services/familyService";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  owner: "Responsável",
  adult: "Adulto",
  dependent: "Dependente",
};

function InviteCodeCard() {
  const familyId = useAppStore((s) => s.familyId);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId) return;
    familyService.fetchInviteCode(familyId).then(setCode).catch(() => toastError("Não foi possível carregar o código de convite."));
  }, [familyId]);

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toastSuccess("Código copiado!");
  }

  function handleShare() {
    if (!code) return;
    const text = `Vem pra nossa família no Gestão Família! Use este código de convite ao criar sua conta: ${code}\nhttps://familia.institutohernandes.org`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-4 w-4 text-sage-500" />
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Código de convite da família</h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">Compartilhe com quem você quer adicionar — a pessoa cria a própria conta e usa esse código.</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono font-semibold text-lg tracking-widest text-sage-600 bg-sage-50 dark:bg-sage-600/20 rounded-xl px-4 py-2">
          {code ?? "..."}
        </span>
        <button onClick={handleCopy} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
          <Copy className="h-4 w-4 text-slate-500" />
        </button>
        <button onClick={handleShare} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
          <Share2 className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    </Card>
  );
}

const ROLE_ICON: Record<string, typeof Crown> = {
  owner: Crown,
  adult: User,
  dependent: Shield,
};

function MemberEditModal({
  profileId,
  fullName,
  open,
  onClose,
  onSaved,
}: {
  profileId: string;
  fullName: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const familyId = useAppStore((s) => s.familyId);
  const [details, setDetails] = useState<ProfileDetails | null>(null);
  const [fullNameField, setFullNameField] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [canViewFinances, setCanViewFinances] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!familyId) return;
    const data = await familyService.fetchProfileDetails(familyId, profileId);
    setDetails(data);
    setFullNameField(data?.fullName ?? fullName);
    setDisplayName(data?.displayName ?? "");
    setBirthDate(data?.birthDate ?? "");
    setPhone(data?.phone ?? "");
    setCanViewFinances(data?.canViewFinances ?? true);
  }, [familyId, profileId, fullName]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId) return;
    setLoading(true);
    try {
      await familyService.updateProfileDetails(familyId, profileId, {
        fullName: fullNameField,
        displayName,
        birthDate,
        phone,
        canViewFinances,
      });
      toastSuccess("Dados atualizados!");
      onSaved();
      onClose();
    } catch {
      toastError("Não foi possível salvar os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Manutenção de ${fullName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Nome completo" required value={fullNameField} onChange={(e) => setFullNameField(e.target.value)} />
        <TextField label="Nome de exibição" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <TextField label="Data de nascimento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <TextField label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {details?.role !== "owner" && (
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={canViewFinances} onChange={(e) => setCanViewFinances(e.target.checked)} />
            Pode ver detalhes financeiros da família
          </label>
        )}
        <p className="text-xs text-slate-400">
          Papel na família: <span className="font-medium">{details ? ROLE_LABEL[details.role] : "—"}</span>
        </p>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function DashboardPage() {
  const { members, familyId, currentUserId, setFamilyContext } = useAppStore();
  const [selected, setSelected] = useState<{ id: string; fullName: string } | null>(null);

  async function refreshMembers() {
    if (!familyId || !currentUserId) return;
    const result = await familyService.fetchMyFamily(currentUserId);
    if (result) setFamilyContext(result.familyId, currentUserId, result.members);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8"
    >
      <div>
        <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Olá, família! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Selecione um membro para ver e atualizar os dados dele.
        </p>
      </div>

      <InviteCodeCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((m) => {
          const RoleIcon = ROLE_ICON[m.role] ?? User;
          return (
            <Card
              key={m.id}
              onClick={() => setSelected({ id: m.id, fullName: m.fullName })}
              className="p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <Avatar name={m.fullName} src={m.avatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900 dark:text-white truncate">{m.fullName}</h3>
                <p
                  className={cn(
                    "text-xs mt-0.5 inline-flex items-center gap-1",
                    m.role === "owner" ? "text-amber-600" : "text-slate-400"
                  )}
                >
                  <RoleIcon className="h-3 w-3" />
                  {ROLE_LABEL[m.role] ?? m.role}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
            </Card>
          );
        })}
        {members.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10 col-span-full">Nenhum membro na família ainda.</p>
        )}
      </div>

      {selected && (
        <MemberEditModal
          profileId={selected.id}
          fullName={selected.fullName}
          open={!!selected}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            await refreshMembers();
            setSelected(null);
          }}
        />
      )}
    </motion.div>
  );
}
