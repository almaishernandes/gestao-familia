import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { useAppStore } from "@/stores/useAppStore";
import { useSession } from "@/hooks/useSession";
import { useFamilyContext } from "@/hooks/useFamilyContext";

// Placeholders — cada módulo vira uma página própria em src/pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      <p className="text-slate-400 mt-2 text-sm">Módulo em construção.</p>
    </div>
  );
}

const PAGES: Record<string, JSX.Element> = {
  dashboard: <DashboardPage />,
  compras: <PlaceholderPage title="Hub de Compras & Orçamentos" />,
  nutricao: <PlaceholderPage title="Nutrição & Cardápio Semanal" />,
  saude: <PlaceholderPage title="Prontuário Médico Familiar" />,
  viagens: <PlaceholderPage title="Viagens, Férias & Lazer" />,
  financas: <PlaceholderPage title="Controle Financeiro" />,
  feed: <PlaceholderPage title="Mural da Família" />,
  calendario: <PlaceholderPage title="Calendário Unificado" />,
  documentos: <PlaceholderPage title="Central de Documentos" />,
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
