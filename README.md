# Família Hub

Plataforma de gestão familiar integrada (compras, cardápio, saúde, viagens, finanças).

## Stack
React + Vite + TypeScript, Tailwind CSS, Shadcn/UI, Framer Motion, TanStack Query, Zustand, Supabase (Postgres + Auth + Realtime + Storage).

## Como rodar

1. `npm install`
2. Crie um projeto em [supabase.com](https://supabase.com), rode `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
4. Gere os tipos reais do banco: `npx supabase gen types typescript --project-id <id> > src/types/database.types.ts`
5. `npm run dev`

## Estrutura

```
src/
  components/
    layout/      # Sidebar, tabs mobile, navConfig
    dashboard/   # Cards e widgets da tela inicial
    shared/      # CommentsDrawer e componentes reutilizáveis entre módulos
    ui/          # Primitivos (Card, Avatar, ...)
  hooks/         # Hooks de dados (Realtime, React Query)
  pages/         # Uma página por módulo
  stores/        # Zustand (estado global: família ativa, tema, navegação)
  services/      # Camada de acesso a dados (Supabase queries/mutations)
  types/         # Tipos de domínio + tipos gerados do Supabase
supabase/
  schema.sql     # DDL completo + RLS de todas as tabelas
```

## Status atual

- ✅ Schema SQL completo (perfis, compras, nutrição, saúde, viagens, finanças, feed, documentos, calendário, comentários) com RLS.
- ✅ Estrutura de pastas do front-end.
- ✅ Dashboard funcional com navegação (sidebar desktop / tabs mobile), feed em tempo real e drawer de comentários por entidade.
- 🚧 Próximos módulos a implementar: Compras, Nutrição, Saúde, Viagens, Finanças (páginas placeholder já roteadas em `App.tsx`).
