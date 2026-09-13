import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/stores/useAppStore";
import { Plus } from "lucide-react";

export function FamilyMembersBar() {
  const members = useAppStore((s) => s.members);

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {members.slice(0, 5).map((m) => (
          <Avatar key={m.id} name={m.fullName} src={m.avatarUrl} className="ring-2 ring-white dark:ring-slate-900" />
        ))}
      </div>
      <button className="h-10 w-10 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:border-sage-400 hover:text-sage-500">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
