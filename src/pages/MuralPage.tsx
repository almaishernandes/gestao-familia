import { motion } from "framer-motion";
import { FamilyFeedCard } from "@/components/dashboard/FamilyFeedCard";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/stores/useAppStore";

export function MuralPage() {
  const members = useAppStore((s) => s.members);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-4 md:p-8 max-w-3xl mx-auto space-y-6 pb-24 md:pb-8"
    >
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Mural da Família</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Recados, avisos, fotos e conquistas publicados por todo mundo.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 pl-1 pr-3 py-1">
            <Avatar name={m.fullName} src={m.avatarUrl} size="sm" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{m.fullName}</span>
          </div>
        ))}
      </div>

      <FamilyFeedCard />
    </motion.div>
  );
}
