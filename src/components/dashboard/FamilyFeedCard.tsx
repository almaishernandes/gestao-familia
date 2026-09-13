import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { CommentsDrawer } from "@/components/shared/CommentsDrawer";
import { useFamilyFeed } from "@/hooks/useFamilyFeed";
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

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Mural da Família</h2>
        <button className="text-sm font-medium text-sage-600 hover:text-sage-700">+ Novo aviso</button>
      </div>

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
