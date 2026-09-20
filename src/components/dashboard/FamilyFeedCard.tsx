import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { SelectField, PrimaryButton } from "@/components/ui/Field";
import { CommentsDrawer } from "@/components/shared/CommentsDrawer";
import { useFamilyFeed } from "@/hooks/useFamilyFeed";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as feedService from "@/services/feedService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Megaphone, Image as ImageIcon, MessageSquare } from "lucide-react";

const TYPE_ICON = {
  foto: ImageIcon,
  aviso: Megaphone,
  recado: MessageSquare,
  conquista: Sparkles,
};

export function FamilyFeedCard() {
  const posts = useFamilyFeed();
  const { familyId, currentUserId } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<"aviso" | "recado" | "conquista">("recado");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId || !content.trim()) return;
    setLoading(true);
    try {
      await feedService.createPost(familyId, currentUserId, type, content.trim());
      toastSuccess("Publicado no mural!");
      setContent("");
      setModalOpen(false);
    } catch {
      toastError("Não foi possível publicar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-slate-500 dark:text-slate-400 text-sm">Publicações recentes</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm font-medium text-sage-600 hover:text-sage-700"
        >
          + Novo aviso
        </button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo post no mural">
        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Tipo" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="recado">Recado</option>
            <option value="aviso">Aviso</option>
            <option value="conquista">Conquista</option>
          </SelectField>
          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Mensagem</span>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sage-400"
            />
          </label>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Publicando..." : "Publicar"}
          </PrimaryButton>
        </form>
      </Modal>

      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-1">
        {posts.length === 0 && (
          <p className="text-sm text-slate-400 py-6 text-center">
            Nada por aqui ainda. Compartilhe uma novidade com a família!
          </p>
        )}
        {posts.map((post) => {
          const Icon = TYPE_ICON[post.type];
          return (
            <div key={post.id} className="flex gap-3 pb-4 border-b border-slate-50 dark:border-slate-700 last:border-0">
              <Avatar name={post.authorName} src={post.authorAvatarUrl} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {post.authorName}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-terracotta-500" />
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                {post.content && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{post.content}</p>
                )}
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="mt-2 rounded-xl max-h-48 object-cover w-full"
                  />
                )}
                <div className="mt-2">
                  <CommentsDrawer entityType="feed_post" entityId={post.id} label="Comentários do post" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
