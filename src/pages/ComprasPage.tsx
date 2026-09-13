import { useState } from "react";
import { ArrowLeft, Plus, Share2, Trash2, ScanLine } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { CommentsDrawer } from "@/components/shared/CommentsDrawer";
import { ReceiptScannerModal } from "@/components/shared/ReceiptScannerModal";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { useShoppingItems } from "@/hooks/useShoppingList";
import { useAppStore } from "@/stores/useAppStore";
import * as shoppingService from "@/services/shoppingService";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "alimentos", label: "Alimentos" },
  { value: "higiene", label: "Higiene" },
  { value: "medicamentos", label: "Medicamentos" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "limpeza", label: "Limpeza" },
  { value: "outros", label: "Outros" },
];

function NewListModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId } = useAppStore();
  const [title, setTitle] = useState("");
  const [storeType, setStoreType] = useState("supermercado");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId) return;
    setLoading(true);
    await shoppingService.createList(familyId, currentUserId, title, storeType);
    setLoading(false);
    setTitle("");
    onCreated();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova lista de compras">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Nome da lista"
          required
          placeholder="Ex: Supermercado da semana"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <SelectField label="Tipo" value={storeType} onChange={(e) => setStoreType(e.target.value)}>
          <option value="supermercado">Supermercado</option>
          <option value="farmacia">Farmácia</option>
          <option value="internet">Internet</option>
          <option value="outros">Outros</option>
        </SelectField>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Criando..." : "Criar lista"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function ListDetail({ listId, title, onBack }: { listId: string; title: string; onBack: () => void }) {
  const { items, reload } = useShoppingItems(listId);
  const { currentUserId } = useAppStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("alimentos");
  const [quantity, setQuantity] = useState(1);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await shoppingService.addItem(listId, name.trim(), category, quantity);
    setName("");
    setQuantity(1);
    reload();
  }

  async function handleToggle(itemId: string, checked: boolean) {
    if (!currentUserId) return;
    await shoppingService.toggleItem(itemId, checked, currentUserId);
    reload();
  }

  async function handleDelete(itemId: string) {
    await shoppingService.deleteItem(itemId);
    reload();
  }

  function handleShare() {
    const text = shoppingService.formatListForWhatsApp(title, items);
    window.open(shoppingService.buildWhatsAppShareUrl(text), "_blank");
  }

  const checkedCount = items.filter((i) => i.isChecked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-sage-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold text-lg text-slate-900 dark:text-white flex-1">{title}</h2>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:text-sage-700"
        >
          <Share2 className="h-4 w-4" />
          WhatsApp
        </button>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-slate-400">
            {checkedCount} de {items.length} comprados
          </span>
          <CommentsDrawer entityType="shopping_list" entityId={listId} />
        </div>

        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Adicionar item..."
            className="flex-1 min-w-[140px] rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-sm outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-16 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-2 text-sm outline-none"
          />
          <button type="submit" className="rounded-xl bg-sage-500 hover:bg-sage-600 text-white px-4 text-sm font-medium">
            <Plus className="h-4 w-4" />
          </button>
        </form>

        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 group"
            >
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={(e) => handleToggle(item.id, e.target.checked)}
                className="h-5 w-5 rounded accent-sage-500"
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.isChecked ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
                )}
              >
                {item.name}
                {item.quantity > 1 && (
                  <span className="text-slate-400"> ({item.quantity}{item.unit ? ` ${item.unit}` : ""})</span>
                )}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-terracotta-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Lista vazia. Adicione o primeiro item.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

export function ComprasPage() {
  const { lists, reload } = useShoppingLists();
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      {selected ? (
        <ListDetail listId={selected.id} title={selected.title} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Hub de Compras</h1>
              <p className="text-sm text-slate-400 mt-1">Listas compartilhadas em tempo real com a família.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setScannerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ScanLine className="h-4 w-4" />
                Escanear cupom
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
              >
                <Plus className="h-4 w-4" />
                Nova lista
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.map((list) => (
              <Card
                key={list.id}
                onClick={() => setSelected({ id: list.id, title: list.title })}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-slate-900 dark:text-white">{list.title}</h3>
                <p className="text-xs text-slate-400 mt-1 capitalize">{list.storeType}</p>
              </Card>
            ))}
          </div>
          {lists.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">Nenhuma lista ainda. Crie a primeira!</p>
          )}
        </>
      )}

      <NewListModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
      <ReceiptScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onImported={reload} />
    </div>
  );
}
