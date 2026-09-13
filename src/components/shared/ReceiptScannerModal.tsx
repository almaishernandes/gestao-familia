import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Modal } from "@/components/ui/Modal";
import { PrimaryButton } from "@/components/ui/Field";
import { useAppStore } from "@/stores/useAppStore";
import * as receiptsService from "@/services/receiptsService";
import type { ParsedReceipt } from "@/services/receiptsService";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const SCANNER_ELEMENT_ID = "nfce-qr-scanner";

type Step = "scanning" | "parsing" | "review" | "error" | "done";

interface ReceiptScannerModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ReceiptScannerModal({ open, onClose, onImported }: ReceiptScannerModalProps) {
  const { familyId, currentUserId } = useAppStore();
  const [step, setStep] = useState<Step>("scanning");
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("scanning");
    setParsed(null);

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;
    let stopped = false;

    async function stopScanner() {
      if (stopped) return;
      stopped = true;
      if (scanner.isScanning) {
        await scanner.stop().catch(() => {});
      }
      scanner.clear();
    }

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          setScannedUrl(decodedText);
          handleParse(decodedText);
        },
        () => {
          // ignora frames sem QR code detectado
        }
      )
      .catch(() => {
        setStep("error");
        setParsed({ status: "erro", errorMessage: "Não foi possível acessar a câmera do dispositivo." });
      });

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleParse(url: string) {
    setStep("parsing");
    try {
      const result = await receiptsService.parseNfceUrl(url);
      setParsed(result);
      setStep(result.status === "processado" ? "review" : "error");
    } catch (err: any) {
      setParsed({ status: "erro", errorMessage: err.message ?? "Erro ao consultar o cupom fiscal." });
      setStep("error");
    }
  }

  async function handleConfirmImport() {
    if (!familyId || !currentUserId || !parsed?.items) return;
    const listId = await receiptsService.createListFromReceipt(familyId, currentUserId, parsed.storeName, parsed.items);
    await receiptsService.saveReceipt(familyId, currentUserId, scannedUrl, parsed, listId);
    setStep("done");
    onImported();
  }

  async function handleSaveForManualReview() {
    if (!familyId || !currentUserId || !parsed) return;
    await receiptsService.saveReceipt(familyId, currentUserId, scannedUrl, parsed, null);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Escanear cupom fiscal (NFC-e)">
      <div className="space-y-4">
        {step === "scanning" && (
          <>
            <div id={SCANNER_ELEMENT_ID} className="rounded-xl overflow-hidden bg-slate-900" />
            <p className="text-xs text-slate-400 text-center">
              Aponte a câmera para o QR Code impresso no cupom fiscal.
            </p>
          </>
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Loader2 className="h-6 w-6 text-sage-500 animate-spin" />
            <p className="text-sm text-slate-500">Consultando o cupom na SEFAZ...</p>
          </div>
        )}

        {step === "review" && parsed?.items && (
          <>
            <div className="flex items-center gap-2 text-sage-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium">
                {parsed.storeName ?? "Estabelecimento"} — R$ {parsed.totalAmount?.toFixed(2) ?? "—"}
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-1.5 border-t border-b border-slate-100 dark:border-slate-700 py-2">
              {parsed.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-200">
                    {item.name} {item.quantity > 1 && <span className="text-slate-400">x{item.quantity}</span>}
                  </span>
                  <span className="text-slate-500">R$ {item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <PrimaryButton onClick={handleConfirmImport}>
              Importar {parsed.items.length} itens para o histórico de compras
            </PrimaryButton>
          </>
        )}

        {step === "error" && (
          <>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AlertTriangle className="h-6 w-6 text-terracotta-500" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {parsed?.errorMessage ?? "Não foi possível ler este cupom automaticamente."}
              </p>
              <p className="text-xs text-slate-400">
                O link do cupom foi salvo — você pode lançar os itens manualmente no Hub de Compras.
              </p>
            </div>
            <PrimaryButton onClick={handleSaveForManualReview}>Ok, entendi</PrimaryButton>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-6 w-6 text-sage-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Compra importada com sucesso!</p>
            <PrimaryButton onClick={onClose}>Fechar</PrimaryButton>
          </div>
        )}
      </div>
    </Modal>
  );
}
