import { useEffect, useState, useCallback } from "react";
import { Plus, Lock, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { useAppStore } from "@/stores/useAppStore";
import * as financeService from "@/services/financeService";
import type { BankAccount, Transaction } from "@/services/financeService";
import { cn } from "@/lib/utils";

function NewAccountModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, members } = useAppStore();
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("corrente");
  const [balance, setBalance] = useState("0");
  const [ownerId, setOwnerId] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId) return;
    setLoading(true);
    await financeService.createAccount(familyId, name, accountType, Number(balance), ownerId || null, isPrivate);
    setLoading(false);
    setName("");
    setBalance("0");
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova conta">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Nome da conta" required value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField label="Tipo" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="corrente">Conta corrente</option>
          <option value="poupanca">Poupança</option>
          <option value="investimento">Investimento</option>
          <option value="reserva_emergencia">Reserva de emergência</option>
        </SelectField>
        <TextField label="Saldo atual (R$)" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} />
        <SelectField label="Dono da conta" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
          <option value="">Família (compartilhada)</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </SelectField>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Ocultar saldo de membros sem permissão financeira
        </label>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function NewTransactionModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId } = useAppStore();
  const [kind, setKind] = useState<Transaction["kind"]>("despesa_fixa");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("moradia");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId) return;
    setLoading(true);
    await financeService.createTransaction(
      familyId,
      currentUserId,
      kind,
      description,
      Number(amount),
      category,
      dueDate || null
    );
    setLoading(false);
    setDescription("");
    setAmount("");
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo lançamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Tipo" value={kind} onChange={(e) => setKind(e.target.value as Transaction["kind"])}>
          <option value="receita">Receita</option>
          <option value="despesa_fixa">Despesa fixa</option>
          <option value="despesa_variavel">Despesa variável</option>
        </SelectField>
        <TextField label="Descrição" required value={description} onChange={(e) => setDescription(e.target.value)} />
        <TextField label="Valor (R$)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextField label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
        <TextField label="Vencimento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function FinancasPage() {
  const familyId = useAppStore((s) => s.familyId);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    const [a, t] = await Promise.all([
      financeService.fetchAccounts(familyId),
      financeService.fetchTransactions(familyId),
    ]);
    setAccounts(a);
    setTransactions(t);
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleTogglePaid(id: string, isPaid: boolean) {
    await financeService.togglePaid(id, isPaid);
    reload();
  }

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Controle Financeiro</h1>
          <p className="text-sm text-slate-400 mt-1">Saldo consolidado: R$ {totalBalance.toFixed(2)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAccountModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Conta
          </button>
          <button
            onClick={() => setTxModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-3 py-2"
          >
            <Plus className="h-4 w-4" />
            Lançamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {accounts.map((acc) => (
          <Card key={acc.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-sage-50 dark:bg-sage-600/20 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-sage-600" />
              </div>
              {acc.isPrivate && <Lock className="h-4 w-4 text-slate-300" />}
            </div>
            <h3 className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{acc.name}</h3>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              R$ {acc.currentBalance.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 mt-1 capitalize">{acc.accountType?.replace("_", " ")}</p>
          </Card>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm text-slate-400 col-span-full text-center py-6">Nenhuma conta cadastrada.</p>
        )}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Despesas e receitas</h2>
        <div className="space-y-1.5">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={tx.isPaid}
                onChange={(e) => handleTogglePaid(tx.id, e.target.checked)}
                className="h-5 w-5 rounded accent-sage-500"
              />
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm",
                    tx.isPaid ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
                  )}
                >
                  {tx.description}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {tx.category} {tx.dueDate && `· vence ${tx.dueDate}`}
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  tx.kind === "receita" ? "text-sage-600" : "text-terracotta-500"
                )}
              >
                {tx.kind === "receita" ? "+" : "-"} R$ {tx.amount.toFixed(2)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum lançamento registrado.</p>
          )}
        </div>
      </Card>

      <NewAccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} onCreated={reload} />
      <NewTransactionModal open={txModalOpen} onClose={() => setTxModalOpen(false)} onCreated={reload} />
    </div>
  );
}
