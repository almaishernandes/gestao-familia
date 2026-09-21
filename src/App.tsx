import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ToastHost } from "@/components/shared/ToastHost";
import { DashboardPage } from "@/pages/DashboardPage";
import { MuralPage } from "@/pages/MuralPage";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { AdminPage } from "@/pages/AdminPage";
import { ComprasPage } from "@/pages/ComprasPage";
import { NutricaoPage } from "@/pages/NutricaoPage";
import { SaudePage } from "@/pages/SaudePage";
import { ViagensPage } from "@/pages/ViagensPage";
import { FinancasPage } from "@/pages/FinancasPage";
import { CalendarioPage } from "@/pages/CalendarioPage";
import { DocumentosPage } from "@/pages/DocumentosPage";
import { useAppStore } from "@/stores/useAppStore";
import { useSession } from "@/hooks/useSession";
import { useFamilyContext } from "@/hooks/useFamilyContext";
import * as familyService from "@/services/familyService";
import { signOut } from "@/services/authService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGES: Record<string, JSX.Element> = {
  dashboard: <DashboardPage />,
  compras: <ComprasPage />,
  nutricao: <NutricaoPage />,
  saude: <SaudePage />,
  viagens: <ViagensPage />,
  financas: <FinancasPage />,
  feed: <MuralPage />,
  calendario: <CalendarioPage />,
  documentos: <DocumentosPage />,
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="h-12 w-12 rounded-xl2 bg-sage-500 flex items-center justify-center"
      >
        <Home className="h-6 w-6 text-white" />
      </motion.div>
      <p className="text-sm text-slate-400">Carregando...</p>
    </div>
  );
}

function SubscriptionBlockedScreen({ status, nextDueAt }: { status: string; nextDueAt: string | null }) {
  const message =
    status === "cancelada"
      ? "A assinatura da sua família foi cancelada."
      : "O pagamento da sua família está em atraso.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900 p-4 text-center">
      <AlertTriangle className="h-10 w-10 text-terracotta-500" />
      <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Acesso temporariamente bloqueado</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{message}</p>
      {nextDueAt && (
        <p className="text-xs text-slate-400">
          Vencimento: {format(new Date(nextDueAt + "T00:00:00"), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2">
        Fale com quem administra sua assinatura do Gestão Família para regularizar o acesso.
      </p>
      <button onClick={() => signOut()} className="text-sm text-sage-600 font-medium mt-2">
        Sair
      </button>
    </div>
  );
}

function FamilyApp() {
  const { activeModule, theme, familyId } = useAppStore();
  const { session, loading: sessionLoading } = useSession();
  const { loading: familyLoading, hasFamily, reload } = useFamilyContext(session?.user.id);
  const [subscription, setSubscription] = useState<familyService.SubscriptionInfo | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!familyId) {
      setSubscriptionLoading(false);
      return;
    }
    setSubscriptionLoading(true);
    familyService
      .fetchSubscriptionInfo(familyId)
      .then(setSubscription)
      .finally(() => setSubscriptionLoading(false));
  }, [familyId]);

  if (sessionLoading) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  if (familyLoading) return <LoadingScreen />;
  if (!hasFamily) return <OnboardingPage onDone={reload} />;
  if (subscriptionLoading) return <LoadingScreen />;
  if (subscription && (subscription.status === "atrasada" || subscription.status === "cancelada")) {
    return <SubscriptionBlockedScreen status={subscription.status} nextDueAt={subscription.nextDueAt} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {PAGES[activeModule]}
          </motion.div>
        </AnimatePresence>
      </main>
      <MobileTabBar />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/*" element={<FamilyApp />} />
    </Routes>
  );
}
