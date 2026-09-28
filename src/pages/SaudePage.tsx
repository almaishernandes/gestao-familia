import { useEffect, useState, useCallback } from "react";
import { Pill, Trash2, Plus, FileText, FlaskConical, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppStore } from "@/stores/useAppStore";
import { toastSuccess, toastError } from "@/stores/useToastStore";
import * as healthService from "@/services/healthService";
import type {
  HealthProfile,
  Medication,
  Prescription,
  PrescriptionItem,
  MedicalExam,
  ExamStatus,
} from "@/services/healthService";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Tab = "prontuario" | "receituario" | "medicacao" | "exames";

const TABS: { key: Tab; label: string; icon: typeof ClipboardList }[] = [
  { key: "prontuario", label: "Prontuário", icon: ClipboardList },
  { key: "receituario", label: "Receituário", icon: FileText },
  { key: "medicacao", label: "Medicação", icon: Pill },
  { key: "exames", label: "Exames", icon: FlaskConical },
];

const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  agendado: "Agendado",
  realizado: "Realizado",
  aguardando_resultado: "Aguardando resultado",
  concluido: "Concluído",
};

const EXAM_STATUS_COLOR: Record<ExamStatus, string> = {
  agendado: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  realizado: "bg-sky-50 text-sky-600 dark:bg-sky-600/20 dark:text-sky-400",
  aguardando_resultado: "bg-amber-50 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400",
  concluido: "bg-sage-50 text-sage-600 dark:bg-sage-600/20 dark:text-sage-400",
};

// ---------------------------------------------------------------------------
// Prontuário
// ---------------------------------------------------------------------------

function EmergencyCard({ profileId, fullName }: { profileId: string; fullName: string }) {
  const familyId = useAppStore((s) => s.familyId);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const load = useCallback(async () => {
    const data = await healthService.fetchHealthProfile(profileId);
    setProfile(data);
    setBloodType(data?.bloodType ?? "");
    setAllergies((data?.allergies ?? []).join(", "));
    setContactName(data?.emergencyContactName ?? "");
    setContactPhone(data?.emergencyContactPhone ?? "");
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId) return;
    try {
      await healthService.upsertHealthProfile(familyId, profileId, {
        bloodType: bloodType || null,
        allergies: allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        emergencyContactName: contactName || null,
        emergencyContactPhone: contactPhone || null,
      });
      toastSuccess("Ficha de saúde atualizada.");
      setEditing(false);
      load();
    } catch {
      toastError("Não foi possível salvar a ficha.");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={fullName} />
        <div>
          <h3 className="font-medium text-slate-900 dark:text-white">{fullName}</h3>
          <p className="text-xs text-slate-400">Tipo sanguíneo: {profile?.bloodType ?? "não informado"}</p>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3">
          <TextField label="Tipo sanguíneo" value={bloodType} onChange={(e) => setBloodType(e.target.value)} />
          <TextField
            label="Alergias (separadas por vírgula)"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
          <TextField
            label="Contato de emergência"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <TextField
            label="Telefone de emergência"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <PrimaryButton type="submit">Salvar</PrimaryButton>
        </form>
      ) : (
        <div className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
          <p>
            <span className="text-slate-400">Alergias: </span>
            {profile?.allergies?.length ? profile.allergies.join(", ") : "nenhuma registrada"}
          </p>
          <p>
            <span className="text-slate-400">Emergência: </span>
            {profile?.emergencyContactName ?? "—"} {profile?.emergencyContactPhone ? `(${profile.emergencyContactPhone})` : ""}
          </p>
          <button onClick={() => setEditing(true)} className="text-sage-600 text-sm font-medium mt-2">
            Editar
          </button>
        </div>
      )}
    </Card>
  );
}

function RecordSection({
  title,
  icon: Icon,
  isEmpty,
  onSeeAll,
  children,
}: {
  title: string;
  icon: typeof ClipboardList;
  isEmpty: boolean;
  onSeeAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-sage-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <button onClick={onSeeAll} className="text-xs font-medium text-sage-600">
          Ver tudo
        </button>
      </div>
      {isEmpty ? (
        <p className="text-xs text-slate-400">Nenhum registro ainda.</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </Card>
  );
}

function ProntuarioTab({ onNavigateTab }: { onNavigateTab: (tab: Tab) => void }) {
  const { familyId, members, currentUserId, selectedMemberId } = useAppStore();
  const activeMemberId = selectedMemberId ?? currentUserId;
  const activeMember = members.find((m) => m.id === activeMemberId) ?? members[0];

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [exams, setExams] = useState<MedicalExam[]>([]);

  useEffect(() => {
    if (!familyId) return;
    healthService.fetchPrescriptions(familyId).then(setPrescriptions);
    healthService.fetchMedications(familyId).then(setMedications);
    healthService.fetchExams(familyId).then(setExams);
  }, [familyId, activeMemberId]);

  if (!activeMember) return null;

  const memberPrescriptions = prescriptions.filter((p) => p.profileId === activeMember.id).slice(0, 3);
  const memberMedications = medications.filter((m) => m.profileId === activeMember.id);
  const memberExams = exams.filter((e) => e.profileId === activeMember.id).slice(0, 3);

  return (
    <div className="space-y-4">
      <EmergencyCard key={activeMember.id} profileId={activeMember.id} fullName={activeMember.fullName} />

      <RecordSection
        title="Últimas receitas"
        icon={FileText}
        isEmpty={memberPrescriptions.length === 0}
        onSeeAll={() => onNavigateTab("receituario")}
      >
        {memberPrescriptions.map((p) => (
          <div key={p.id} className="text-sm text-slate-600 dark:text-slate-300">
            {p.items.length > 0 ? (
              p.items.map((it, i) => (
                <div key={i}>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{it.name}</span>
                  {it.instructions && <span className="text-slate-400"> — {it.instructions}</span>}
                </div>
              ))
            ) : (
              <span className="font-medium text-slate-800 dark:text-slate-100">Receita</span>
            )}
            <span className="text-xs text-slate-400">
              {format(new Date(p.issuedDate + "T00:00:00"), "d/M/yyyy")}
            </span>
          </div>
        ))}
      </RecordSection>

      <RecordSection
        title="Medicações contínuas"
        icon={Pill}
        isEmpty={memberMedications.length === 0}
        onSeeAll={() => onNavigateTab("medicacao")}
      >
        {memberMedications.map((m) => (
          <div key={m.id} className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-800 dark:text-slate-100">{m.name}</span>
            {m.dosage && ` — ${m.dosage}`}
            <span className="text-slate-400"> · {m.frequency}</span>
          </div>
        ))}
      </RecordSection>

      <RecordSection
        title="Exames"
        icon={FlaskConical}
        isEmpty={memberExams.length === 0}
        onSeeAll={() => onNavigateTab("exames")}
      >
        {memberExams.map((e) => (
          <div key={e.id} className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-800 dark:text-slate-100">{e.examName}</span>
            <span className="text-slate-400"> · {EXAM_STATUS_LABEL[e.status]}</span>
          </div>
        ))}
      </RecordSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receituário
// ---------------------------------------------------------------------------

const EMPTY_ITEM: PrescriptionItem = { name: "", dosage: "", instructions: "", quantity: "" };

function PriceSearchLinks({
  medicationName,
  prices,
  onChangePrice,
}: {
  medicationName: string;
  prices?: Record<string, string>;
  onChangePrice?: (pharmacyLabel: string, value: string) => void;
}) {
  if (!medicationName.trim()) return null;
  const links = healthService.buildPriceSearchLinks(medicationName);
  return (
    <div className="space-y-1 mt-1.5">
      {links.map((l) => {
        const isGeneral = l.label === "Comparar no Google";
        return (
          <div key={l.label} className="flex items-center gap-1.5">
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-medium text-sage-600 bg-sage-50 dark:bg-sage-600/20 rounded-full px-2 py-0.5 hover:bg-sage-100 shrink-0"
            >
              {l.label}
            </a>
            {!isGeneral && (
              <input
                placeholder="R$"
                value={prices?.[l.label] ?? ""}
                readOnly={!onChangePrice}
                onChange={(e) => onChangePrice?.(l.label, e.target.value)}
                className="w-20 text-[11px] rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 outline-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewPrescriptionModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId, members, selectedMemberId } = useAppStore();
  const [profileId, setProfileId] = useState(selectedMemberId ?? members[0]?.id ?? "");
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorCrm, setDoctorCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDate, setValidityDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...EMPTY_ITEM }]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function updateItem(index: number, field: keyof PrescriptionItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  function updateItemPrice(index: number, pharmacyLabel: string, value: string) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, prices: { ...it.prices, [pharmacyLabel]: value } } : it))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((it) => it.name.trim());
    if (!familyId || !currentUserId || !profileId || validItems.length === 0) return;
    setLoading(true);
    try {
      await healthService.addPrescription(
        familyId,
        currentUserId,
        profileId,
        doctorName,
        doctorCrm,
        specialty,
        issuedDate,
        validityDate,
        validItems,
        notes,
        photoFile
      );
      toastSuccess("Receita registrada.");
      setDoctorName("");
      setDoctorCrm("");
      setSpecialty("");
      setNotes("");
      setItems([{ ...EMPTY_ITEM }]);
      setPhotoFile(null);
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível salvar a receita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova receita médica">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Paciente" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </SelectField>

        <div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Medicamentos e posologia</span>
          <div className="space-y-2 mt-1">
            {items.map((item, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 space-y-2">
                <input
                  placeholder="Medicamento"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm outline-none"
                />
                <input
                  placeholder="Posologia (ex: 1 comprimido de 500mg a cada 8h, por 7 dias)"
                  value={item.instructions}
                  onChange={(e) => updateItem(i, "instructions", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm outline-none"
                />
                <PriceSearchLinks
                  medicationName={item.name}
                  prices={item.prices}
                  onChangePrice={(label, value) => updateItemPrice(i, label, value)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
            className="mt-2 text-xs font-medium text-sage-600"
          >
            + Adicionar medicamento
          </button>
        </div>

        <TextField label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">
            Foto da receita (opcional)
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sage-50 file:text-sage-600 file:px-3 file:py-1.5 file:text-sm file:font-medium dark:file:bg-sage-600/20"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowDoctorDetails((v) => !v)}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {showDoctorDetails ? "Ocultar" : "+ Adicionar"} dados do médico (opcional)
          </button>
          {showDoctorDetails && (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Médico(a)" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
                <TextField label="CRM" value={doctorCrm} onChange={(e) => setDoctorCrm(e.target.value)} />
              </div>
              <TextField label="Especialidade" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Data de emissão" type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
                <TextField label="Válida até" type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar receita"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function ReceituarioTab() {
  const { familyId, members } = useAppStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setPrescriptions(await healthService.fetchPrescriptions(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleDelete(id: string) {
    try {
      await healthService.deletePrescription(id);
      reload();
    } catch {
      toastError("Não foi possível remover a receita.");
    }
  }

  async function handleViewDocument(storagePath: string) {
    try {
      const url = await healthService.getMedicalDocumentUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toastError("Não foi possível abrir o documento.");
    }
  }

  async function handlePriceChange(prescriptionId: string, itemIndex: number, pharmacyLabel: string, value: string) {
    setPrescriptions((prev) =>
      prev.map((p) =>
        p.id !== prescriptionId
          ? p
          : {
              ...p,
              items: p.items.map((it, i) =>
                i !== itemIndex ? it : { ...it, prices: { ...it.prices, [pharmacyLabel]: value } }
              ),
            }
      )
    );
    const updated = prescriptions.find((p) => p.id === prescriptionId);
    if (!updated) return;
    const newItems = updated.items.map((it, i) =>
      i !== itemIndex ? it : { ...it, prices: { ...it.prices, [pharmacyLabel]: value } }
    );
    try {
      await healthService.updatePrescriptionItems(prescriptionId, newItems);
    } catch {
      toastError("Não foi possível salvar o preço.");
    }
  }

  function memberName(id: string) {
    return members.find((m) => m.id === id)?.fullName ?? "Membro";
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-3 py-2"
        >
          <Plus className="h-4 w-4" />
          Nova receita
        </button>
      </div>

      <div className="space-y-3">
        {prescriptions.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {p.doctorName || "Receita"}
                  {p.specialty && <span className="text-slate-400 font-normal"> — {p.specialty}</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {memberName(p.profileId)} · Emitida em {format(new Date(p.issuedDate + "T00:00:00"), "d/M/yyyy")}
                  {p.validityDate && ` · Válida até ${format(new Date(p.validityDate + "T00:00:00"), "d/M/yyyy")}`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {p.storagePath && (
                  <button
                    onClick={() => handleViewDocument(p.storagePath!)}
                    className="text-xs font-medium text-sage-600"
                  >
                    Ver receita
                  </button>
                )}
                <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-danger-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              {p.items.map((item, i) => (
                <div key={i}>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{item.name}</span>
                    {item.dosage && ` — ${item.dosage}`}
                    {item.quantity && ` (${item.quantity})`}
                    {item.instructions && <span className="text-slate-400"> · {item.instructions}</span>}
                  </p>
                  <PriceSearchLinks
                    medicationName={item.name}
                    prices={item.prices}
                    onChangePrice={(label, value) => handlePriceChange(p.id, i, label, value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
        {prescriptions.length === 0 && <EmptyState icon={FileText} title="Nenhuma receita registrada" />}
      </div>

      <NewPrescriptionModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Medicação
// ---------------------------------------------------------------------------

function NewMedicationModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, members, selectedMemberId } = useAppStore();
  const [profileId, setProfileId] = useState(selectedMemberId ?? members[0]?.id ?? "");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !profileId) return;
    setLoading(true);
    try {
      await healthService.addMedication(familyId, profileId, name, dosage, frequency);
      toastSuccess("Medicamento adicionado.");
      setName("");
      setDosage("");
      setFrequency("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível salvar o medicamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo medicamento contínuo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Membro" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </SelectField>
        <TextField label="Nome do medicamento" required value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Dosagem" placeholder="Ex: 500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
        <TextField
          label="Frequência"
          placeholder="Ex: a cada 8 horas"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function MedicacaoTab() {
  const { familyId, members } = useAppStore();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setMedications(await healthService.fetchMedications(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleRemove(id: string) {
    try {
      await healthService.deactivateMedication(id);
      reload();
    } catch {
      toastError("Não foi possível remover o medicamento.");
    }
  }

  function memberName(profileId: string) {
    return members.find((m) => m.id === profileId)?.fullName ?? "Membro";
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-3 py-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      <Card className="p-2">
        {medications.map((med) => (
          <div
            key={med.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 group"
          >
            <div className="h-9 w-9 rounded-xl bg-danger-50 dark:bg-danger-600/20 flex items-center justify-center">
              <Pill className="h-4 w-4 text-danger-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {med.name} {med.dosage && <span className="text-slate-400 font-normal">— {med.dosage}</span>}
              </p>
              <p className="text-xs text-slate-400">
                {memberName(med.profileId)} · {med.frequency}
              </p>
            </div>
            <button
              onClick={() => handleRemove(med.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-danger-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {medications.length === 0 && <EmptyState icon={Pill} title="Nenhum medicamento contínuo cadastrado" />}
      </Card>

      <NewMedicationModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exames médicos
// ---------------------------------------------------------------------------

function NewExamModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId, members, selectedMemberId } = useAppStore();
  const [profileId, setProfileId] = useState(selectedMemberId ?? members[0]?.id ?? "");
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [labName, setLabName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId || !profileId || !examName) return;
    setLoading(true);
    try {
      await healthService.addExam(familyId, currentUserId, profileId, examName, examType, requestedBy, labName, scheduledAt);
      toastSuccess("Exame agendado.");
      setExamName("");
      setExamType("");
      setRequestedBy("");
      setLabName("");
      setScheduledAt("");
      onCreated();
      onClose();
    } catch {
      toastError("Não foi possível salvar o exame.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo exame médico">
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Paciente" value={profileId} onChange={(e) => setProfileId(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </SelectField>
        <TextField label="Nome do exame" required value={examName} onChange={(e) => setExamName(e.target.value)} />
        <TextField label="Tipo" placeholder="Ex: sangue, imagem, cardiológico" value={examType} onChange={(e) => setExamType(e.target.value)} />
        <TextField label="Médico solicitante" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
        <TextField label="Laboratório / clínica" value={labName} onChange={(e) => setLabName(e.target.value)} />
        <TextField label="Data e hora agendada" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar exame"}
        </PrimaryButton>
      </form>
    </Modal>
  );
}

function ExamesTab() {
  const { familyId, members } = useAppStore();
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!familyId) return;
    setExams(await healthService.fetchExams(familyId));
  }, [familyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleStatusChange(id: string, status: ExamStatus) {
    try {
      await healthService.updateExamStatus(id, status);
      reload();
    } catch {
      toastError("Não foi possível atualizar o exame.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await healthService.deleteExam(id);
      reload();
    } catch {
      toastError("Não foi possível remover o exame.");
    }
  }

  function memberName(id: string) {
    return members.find((m) => m.id === id)?.fullName ?? "Membro";
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sage-500 hover:bg-sage-600 text-white text-sm font-medium px-3 py-2"
        >
          <Plus className="h-4 w-4" />
          Novo exame
        </button>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => (
          <Card key={exam.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {exam.examName} {exam.examType && <span className="text-slate-400 font-normal">— {exam.examType}</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {memberName(exam.profileId)}
                  {exam.labName && ` · ${exam.labName}`}
                  {exam.requestedByDoctor && ` · Solicitado por ${exam.requestedByDoctor}`}
                </p>
                {exam.scheduledAt && (
                  <p className="text-xs text-slate-400">
                    {format(new Date(exam.scheduledAt), "d MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
              <button onClick={() => handleDelete(exam.id)} className="text-slate-300 hover:text-danger-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {(["agendado", "realizado", "aguardando_resultado", "concluido"] as ExamStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(exam.id, s)}
                  className={cn(
                    "text-xs rounded-full px-2.5 py-1 font-medium",
                    exam.status === s ? EXAM_STATUS_COLOR[s] : "bg-slate-50 text-slate-400 dark:bg-slate-700/50"
                  )}
                >
                  {EXAM_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </Card>
        ))}
        {exams.length === 0 && <EmptyState icon={FlaskConical} title="Nenhum exame registrado" />}
      </div>

      <NewExamModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}

// ---------------------------------------------------------------------------

export function SaudePage() {
  const [tab, setTab] = useState<Tab>("prontuario");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white mb-6">Prontuário Médico Familiar</h1>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700 mb-6 max-w-xl">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg py-2 text-xs sm:text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "prontuario" && <ProntuarioTab onNavigateTab={setTab} />}
      {tab === "receituario" && <ReceituarioTab />}
      {tab === "medicacao" && <MedicacaoTab />}
      {tab === "exames" && <ExamesTab />}
    </div>
  );
}
