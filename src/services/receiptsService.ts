import { supabase } from "@/lib/supabaseClient";

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedReceipt {
  status: "processado" | "erro";
  storeName?: string;
  totalAmount?: number;
  items?: ParsedReceiptItem[];
  errorMessage?: string;
}

/** Chama a Edge Function que busca e interpreta a NFC-e a partir da URL do QR Code. */
export async function parseNfceUrl(nfceUrl: string): Promise<ParsedReceipt> {
  const { data, error } = await supabase.functions.invoke("parse-nfce", { body: { url: nfceUrl } });
  if (error) throw error;
  return data as ParsedReceipt;
}

/** Salva o registro do cupom escaneado (mesmo que o parsing tenha falhado, para histórico). */
export async function saveReceipt(
  familyId: string,
  userId: string,
  nfceUrl: string,
  parsed: ParsedReceipt,
  shoppingListId: string | null
) {
  const { error } = await supabase.from("purchase_receipts").insert({
    family_id: familyId,
    scanned_by: userId,
    nfce_url: nfceUrl,
    store_name: parsed.storeName,
    total_amount: parsed.totalAmount,
    status: parsed.status,
    raw_items: parsed.items ?? null,
    shopping_list_id: shoppingListId,
    error_message: parsed.errorMessage,
  });
  if (error) throw error;
}

/**
 * Cria uma lista de compras já marcada como "comprada" com os itens do
 * cupom fiscal escaneado — vira o histórico automático de compras da família.
 */
export async function createListFromReceipt(
  familyId: string,
  userId: string,
  storeName: string | undefined,
  items: ParsedReceiptItem[]
): Promise<string> {
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({
      family_id: familyId,
      title: storeName ? `Compra — ${storeName}` : "Compra escaneada",
      store_type: "supermercado",
      created_by: userId,
    })
    .select("id")
    .single();
  if (listError) throw listError;

  const rows = items.map((item) => ({
    list_id: list.id,
    name: item.name,
    category: "outros" as const,
    quantity: item.quantity,
    final_price: item.totalPrice,
    is_checked: true,
    bought_by: userId,
    bought_at: new Date().toISOString(),
  }));

  const { error: itemsError } = await supabase.from("shopping_items").insert(rows);
  if (itemsError) throw itemsError;

  return list.id as string;
}
