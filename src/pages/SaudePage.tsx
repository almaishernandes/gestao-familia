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

function ProntuarioTab() {
  const members = useAppStore((s) => s.members);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {members.map((m) => (
        <EmergencyCard key={m.id} profileId={m.id} fullName={m.fullName} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receituário
// ---------------------------------------------------------------------------

const EMPTY_ITEM: PrescriptionItem = { name: "", dosage: "", instructions: "", quantity: "" };

function NewPrescriptionModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const { familyId, currentUserId, members } = useAppStore();
  const [profileId, setProfileId] = useState(members[0]?.id ?? "");
  const [doctorName, setDoctorName] = useState("");
  const [doctorCrm, setDoctorCrm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().slice(0, 10));
  const [validityDate, setValidityDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);

  function updateItem(index: number, field: keyof PrescriptionItem, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!familyId || !currentUserId || !profileId || !doctorName) return;
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
        items.filter((it) => it.name.trim()),
        notes
      );
      toastSuccess("Receita registrada.");
      setDoctorName("");
      setDoctorCrm("");
      setSpecialty("");
      setNotes("");
      setItems([{ ...EMPTY_ITEM }]);
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
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Médico(a)" required value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          <TextField label="CRM" value={doctorCrm} onChange={(e) => setDoctorCrm(e.target.value)} />
        </div>
        <TextField label="Especialidade" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Data de emissão" type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} />
          <TextField label="Válida até" type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} />
        </div>

        <div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Itens prescritos</span>
          <div className="space-y-2 mt-1">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <input
                  placeholder="Medicamento"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  className="col-span-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm outline-none"
                />
                <input
                  placeholder="Dosagem"
                  value={item.dosage}
                  onChange={(e) => updateItem(i, "dosage", e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm outline-none"
                />
                <input
                  placeholder="Quantidade"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm outline-none"
                />
                <input
                  placeholder="Posologia (ex: 1 comp. a cada 8h)"
                  value={item.instructions}
                  onChange={(e) => updateItem(i, "instructions", e.target.value)}
                  className="col-span-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 text-sm outline-none"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
            className="mt-2 text-xs font-medium text-sage-600"
          >
            + Adicionar item
          </button>
        </div>

        <TextField label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
                  {p.doctorName} {p.specialty && <span className="text-slate-400 font-normal">— {p.specialty}</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {memberName(p.profileId)} · Emitida em {format(new Date(p.issuedDate + "T00:00:00"), "d/M/yyyy")}
                  {p.validityDate && ` · Válida até ${format(new Date(p.validityDate + "T00:00:00"), "d/M/yyyy")}`}
                </p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-terracotta-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 mt-2">
              {p.items.map((item, i) => (
                <p key={i} className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{item.name}</span>
                  {item.dosage && ` — ${item.dosage}`}
                  {item.quantity && ` (${item.quantity})`}
                  {item.instructions && <span className="text-slate-400"> · {item.instructions}</span>}
                </p>
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
  const { familyId, members } = useAppStore();
  const [profileId, setProfileId] = useState(members[0]?.id ?? "");
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
            <div className="h-9 w-9 rounded-xl bg-terracotta-50 dark:bg-terracotta-600/20 flex items-center justify-center">
              <Pill className="h-4 w-4 text-terracotta-500" />
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
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-terracotta-500"
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
  const { familyId, currentUserId, members } = useAppStore();
  const [profileId, setProfileId] = useState(members[0]?.id ?? "");
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
              <button onClick={() => handleDelete(exam.id)} className="text-slate-300 hover:text-terracotta-500">
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

      {tab === "prontuario" && <ProntuarioTab />}
      {tab === "receituario" && <ReceituarioTab />}
      {tab === "medicacao" && <MedicacaoTab />}
      {tab === "exames" && <ExamesTab />}
    </div>
  );
}
