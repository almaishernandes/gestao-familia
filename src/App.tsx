import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { ToastHost } from "@/components/shared/ToastHost";
import { DashboardPage } from "@/pages/DashboardPage";
import { MuralPage } from "@/pages/MuralPage";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
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

export default function App() {
  const { activeModule, theme } = useAppStore();
  const { session, loading: sessionLoading } = useSession();
  const { loading: familyLoading, hasFamily, reload } = useFamilyContext(session?.user.id);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (sessionLoading) return <LoadingScreen />;
  if (!session) return <LoginPage />;
  if (familyLoading) return <LoadingScreen />;
  if (!hasFamily) return <OnboardingPage onDone={reload} />;

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
