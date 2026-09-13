import { useEffect, useState, useCallback } from "react";
import { Pill, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField, PrimaryButton } from "@/components/ui/Field";
import { useAppStore } from "@/stores/useAppStore";
import * as healthService from "@/services/healthService";
import type { HealthProfile, Medication } from "@/services/healthService";

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
    await healthService.upsertHealthProfile(familyId, profileId, {
      bloodType: bloodType || null,
      allergies: allergies
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      emergencyContactName: contactName || null,
      emergencyContactPhone: contactPhone || null,
    });
    setEditing(false);
    load();
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

function NewMedicationModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
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
    await healthService.addMedication(familyId, profileId, name, dosage, frequency);
    setLoading(false);
    setName("");
    setDosage("");
    setFrequency("");
    onCreated();
    onClose();
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

export function SaudePage() {
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
    await healthService.deactivateMedication(id);
    reload();
  }

  function memberName(profileId: string) {
    return members.find((m) => m.id === profileId)?.fullName ?? "Membro";
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Prontuário Médico Familiar</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {members.map((m) => (
          <EmergencyCard key={m.id} profileId={m.id} fullName={m.fullName} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Medicamentos contínuos</h2>
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
        {medications.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Nenhum medicamento contínuo cadastrado.</p>
        )}
      </Card>

      <NewMedicationModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}
