import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { useRealtimeComments } from "@/hooks/useRealtimeComments";
import { useAppStore } from "@/stores/useAppStore";
import { toastError } from "@/stores/useToastStore";
import { Avatar } from "@/components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommentsDrawerProps {
  entityType: string;
  entityId: string;
  label?: string;
}

/**
 * Botão flutuante + painel lateral de "Comentários & Diálogo em Tempo Real",
 * reutilizável em qualquer módulo (compras, viagens, saúde, cardápio...).
 */
export function CommentsDrawer({ entityType, entityId, label = "Diálogo da família" }: CommentsDrawerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { familyId, currentUserId } = useAppStore();
  const { comments, sendComment } = useRealtimeComments(entityType, entityId);

  async function handleSend() {
    if (!draft.trim() || !familyId || !currentUserId) return;
    try {
      await sendComment(familyId, currentUserId, draft.trim());
      setDraft("");
    } catch {
      toastError("Não foi possível enviar o comentário.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-sage-600 dark:text-slate-300"
      >
        <MessageCircle className="h-4 w-4" />
        {comments.length > 0 ? `${comments.length} comentário${comments.length > 1 ? "s" : ""}` : "Comentar"}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-slate-900/30 z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-slate-800 z-50 flex flex-col shadow-xl"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
                <button onClick={() => setOpen(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {comments.length === 0 && (
                  <p className="text-sm text-slate-400 text-center mt-8">
                    Nenhum comentário ainda. Inicie a conversa!
                  </p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar name={c.authorName} size="sm" />
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {c.authorName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sage-400"
                />
                <button
                  onClick={handleSend}
                  className="h-10 w-10 shrink-0 rounded-full bg-sage-500 hover:bg-sage-600 text-white flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
