// Gera links mailto: para abrir o e-mail padrão já preenchido (feature @mail).
import { formatBRL, formatDate } from "./format";
import { POLICY_TYPE_LABEL } from "./constants";
import type { PolicyType } from "./types";

function mailto(to: string | null | undefined, subject: string, body: string) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${to ?? ""}?${params.toString().replace(/\+/g, "%20")}`;
}

export function renewalMailto(input: {
  clientName: string;
  email: string | null;
  type: PolicyType | string;
  insurer: string;
  endDate: string | null;
}): string {
  const tipo = POLICY_TYPE_LABEL[input.type as PolicyType] ?? input.type;
  const subject = `Renovação do seu seguro ${tipo} — ${input.insurer}`;
  const body = [
    `Olá, ${input.clientName.split(" ")[0]}!`,
    "",
    `Passando para lembrar que o seu seguro ${tipo} (${input.insurer}) vence em ${formatDate(input.endDate)}.`,
    "Posso preparar a renovação e te enviar as melhores opções de cotação. Quer que eu providencie?",
    "",
    "Abraço,",
  ].join("\n");
  return mailto(input.email, subject, body);
}

export function installmentMailto(input: {
  clientName: string;
  email: string | null;
  number: number;
  amount: number;
  dueDate: string;
  insurer?: string;
}): string {
  const subject = `Lembrete: parcela ${input.number} do seu seguro`;
  const body = [
    `Olá, ${input.clientName.split(" ")[0]}!`,
    "",
    `Lembrete amigável: a parcela ${input.number} no valor de ${formatBRL(input.amount)} vence em ${formatDate(input.dueDate)}.`,
    "Qualquer dúvida sobre o pagamento, é só me chamar.",
    "",
    "Abraço,",
  ].join("\n");
  return mailto(input.email, subject, body);
}
