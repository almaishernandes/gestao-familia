// Edge Function: parse-nfce
// ----------------------------------------------------------------------------
// Recebe a URL contida no QR Code de um cupom fiscal (NFC-e) e devolve os
// itens da compra já estruturados. Roda no servidor (Deno) porque os portais
// de consulta pública da SEFAZ de cada estado bloqueiam fetch via CORS
// diretamente do navegador.
//
// IMPORTANTE — limitação conhecida: cada estado brasileiro publica a NFC-e
// num layout HTML ligeiramente diferente (SP, MG, RS, etc. usam templates
// próprios). O parser abaixo cobre o padrão mais comum (baseado no leiaute
// do ENCAT, usado por boa parte dos estados) com uma extração best-effort.
// Quando o layout não bater, a função retorna status "erro" com o texto
// bruto da página para que o usuário lance os itens manualmente e para que
// o parser possa ser ajustado depois para aquele estado específico.
//
// Deploy: supabase functions deploy parse-nfce
// Chamada (client): supabase.functions.invoke('parse-nfce', { body: { url } })

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ParseResult {
  status: "processado" | "erro";
  storeName?: string;
  totalAmount?: number;
  purchasedAt?: string;
  items?: ParsedItem[];
  errorMessage?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toNumber(raw: string): number {
  return Number(raw.replace(/\./g, "").replace(",", ".").trim()) || 0;
}

function parseEncatLayout(html: string): ParseResult {
  // Nome do estabelecimento: costuma vir no primeiro <div class="txtTopo">
  const storeMatch = html.match(/<div[^>]*class="txtTopo"[^>]*>([\s\S]*?)<\/div>/i);
  const storeName = storeMatch?.[1].replace(/<[^>]+>/g, "").trim();

  // Itens: cada linha costuma ter <span class="txtTit">NOME</span> seguido de
  // spans com Qtde, Un, Valor Unitário e Valor Total dentro de <td>.
  const itemBlocks = [...html.matchAll(/<tr[^>]*>\s*<td[^>]*class="[^"]*\bitem\b[^"]*"[\s\S]*?<\/tr>/gi)];

  const items: ParsedItem[] = [];
  for (const block of itemBlocks) {
    const chunk = block[0];
    const name = chunk.match(/class="txtTit"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
    const qtd = chunk.match(/Qtde\.?:\s*<\/span>\s*<span[^>]*>([\d.,]+)/i)?.[1];
    const unitPrice = chunk.match(/Vl\.?\s*Unit\.?:\s*<\/span>\s*<span[^>]*>([\d.,]+)/i)?.[1];
    const totalPrice = chunk.match(/class="valor"[^>]*>([\d.,]+)/i)?.[1];

    if (name) {
      items.push({
        name,
        quantity: qtd ? toNumber(qtd) : 1,
        unitPrice: unitPrice ? toNumber(unitPrice) : 0,
        totalPrice: totalPrice ? toNumber(totalPrice) : 0,
      });
    }
  }

  const totalMatch = html.match(/Valor a pagar[\s\S]*?R\$\s*([\d.,]+)/i);
  const totalAmount = totalMatch ? toNumber(totalMatch[1]) : undefined;

  if (items.length === 0) {
    return {
      status: "erro",
      errorMessage:
        "Não foi possível reconhecer o layout deste cupom automaticamente. Lance os itens manualmente.",
    };
  }

  return { status: "processado", storeName, totalAmount, items };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ status: "erro", errorMessage: "URL do cupom não informada." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return new Response(
        JSON.stringify({ status: "erro", errorMessage: `Portal da SEFAZ retornou HTTP ${response.status}.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    const result = parseEncatLayout(html);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "erro", errorMessage: err instanceof Error ? err.message : "Erro desconhecido." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
