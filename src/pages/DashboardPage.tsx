import { motion } from "framer-motion";
import { ShoppingCart, Salad, HeartPulse, Plane, Wallet } from "lucide-react";
import { FamilyFeedCard } from "@/components/dashboard/FamilyFeedCard";
import { ModuleSummaryCard } from "@/components/dashboard/ModuleSummaryCard";
import { FamilyMembersBar } from "@/components/dashboard/FamilyMembersBar";
import { useAppStore } from "@/stores/useAppStore";

// Dados mock ilustrativos — substituir por hooks React Query (ex: useShoppingSummary,
// useMealPlanSummary, useHealthAlerts, useTripProgress, useBudgetStatus).
const MOCK_SUMMARY = {
  compras: { metric: "12 itens", subtext: "3 listas ativas", progress: 60 },
  nutricao: { metric: "Semana OK", subtext: "5 de 7 dias planejados", progress: 71 },
  saude: { metric: "2 remédios hoje", subtext: "Próximo às 14h00", progress: undefined },
  viagens: { metric: "Praia — Dez/26", subtext: "R$ 2.400 de R$ 5.000 guardados", progress: 48 },
  financas: { metric: "R$ 18.240", subtext: "Saldo consolidado da família", progress: undefined },
};

export function DashboardPage() {
  const setActiveModule = useAppStore((s) => s.setActiveModule);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 md:pb-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-white">Olá, família! 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Aqui está o resumo do que está acontecendo em casa hoje.
          </p>
        </div>
        <FamilyMembersBar />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <ModuleSummaryCard
          icon={ShoppingCart}
          title="Compras"
          accent="terracotta"
          onClick={() => setActiveModule("compras")}
          {...MOCK_SUMMARY.compras}
        />
        <ModuleSummaryCard
          icon={Salad}
          title="Cardápio"
          accent="sage"
          onClick={() => setActiveModule("nutricao")}
          {...MOCK_SUMMARY.nutricao}
        />
        <ModuleSummaryCard
          icon={HeartPulse}
          title="Saúde"
          accent="rose"
          onClick={() => setActiveModule("saude")}
          {...MOCK_SUMMARY.saude}
        />
        <ModuleSummaryCard
          icon={Plane}
          title="Viagens"
          accent="sky"
          onClick={() => setActiveModule("viagens")}
          {...MOCK_SUMMARY.viagens}
        />
        <ModuleSummaryCard
          icon={Wallet}
          title="Finanças"
          accent="amber"
          onClick={() => setActiveModule("financas")}
          {...MOCK_SUMMARY.financas}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FamilyFeedCard />
        </div>
        <div className="space-y-6">
          {/* Espaço reservado: AgendaWidget (próximos eventos do calendário unificado) */}
          {/* Espaço reservado: MedicationRemindersWidget */}
        </div>
      </div>
    </motion.div>
  );
}
