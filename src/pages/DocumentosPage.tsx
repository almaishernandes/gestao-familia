import { useEffect, useState, useCallback } from "react";
import { Plus, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as documentsService from "@/services/documentsService";
import type { HouseDocument } from "@/services/documentsService";
import { format } from "date-fns";

function UploadModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId } = useAppStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("contrato");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId || !file) return;
    setLoading(true);
    try {
      await documentsService.uploadDocument(familyId, currentUserId, file, title, category);
      toastSuccess("Documento enviado!");
      setTitle("");
      setFile(null);
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível enviar o documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo documento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <SelectField label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="contrato">Contrato de aluguel</option>
          <option value="escritura">Escritura</option>
          <option value="comprovante">Comprovante de residência</option>
          <option value="garantia">Garantia de eletrônico</option>
          <option value="outros">Outros</option>
        </SelectField>
        <label className="block">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Arquivo</span>
          <input
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </label>
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar documento"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

export function DocumentosPage() {
  const familyId = useAppStore((s) => s.familyId);
  const [docs, setDocs] = useState<HouseDocument[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setDocs(await documentsService.fetchDocuments(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleOpen(doc: HouseDocument) {
    const url = await documentsService.getDocumentUrl(doc.storagePath);
    window.open(url, "_blank");
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Central de Documentos</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          Novo
        </button>
      </div>

      <Card className="p-2">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => handleOpen(doc)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 text-left"
          >
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <FileText className="h-4 w-4 text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{doc.title}</p>
              <p className="text-xs text-slate-400 capitalize">
                {doc.category} · {format(new Date(doc.createdAt), "d/M/yyyy")}
              </p>
            </div>
            <Download className="h-4 w-4 text-slate-300" />
          </button>
        ))}
        {docs.length === 0 && (
          <EmptyState icon={FileText} title="Nenhum documento enviado ainda" />
        )}
      </Card>

      <UploadModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}
