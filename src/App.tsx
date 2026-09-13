import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { DashboardPage } from "@/pages/DashboardPage";
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
  feed: <DashboardPage />,
  calendario: <CalendarioPage />,
  documentos: <DocumentosPage />,
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
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
      <main className="flex-1 min-w-0">{PAGES[activeModule]}</main>
      <MobileTabBar />
    </div>
  );
}
