import type {
  Channel,
  ClaimStatus,
  DocCategory,
  InstallmentStatus,
  PaymentMethod,
  PolicyStatus,
  PolicyType,
} from "./types";

export const POLICY_TYPES: { value: PolicyType; label: string; icon: string }[] = [
  { value: "auto", label: "Auto", icon: "car" },
  { value: "residencial", label: "Residencial", icon: "home" },
  { value: "vida", label: "Vida", icon: "heart-pulse" },
  { value: "empresarial", label: "Empresarial", icon: "building-2" },
  { value: "saude", label: "Saúde", icon: "stethoscope" },
  { value: "viagem", label: "Viagem", icon: "plane" },
  { value: "outros", label: "Outros", icon: "shield" },
];

export const POLICY_TYPE_LABEL: Record<PolicyType, string> = Object.fromEntries(
  POLICY_TYPES.map((t) => [t.value, t.label]),
) as Record<PolicyType, string>;

export const POLICY_TYPE_ICON: Record<PolicyType, string> = Object.fromEntries(
  POLICY_TYPES.map((t) => [t.value, t.icon]),
) as Record<PolicyType, string>;

export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = {
  vigente: "Vigente",
  em_cotacao: "Em cotação",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão de crédito" },
  { value: "debito", label: "Débito em conta" },
  { value: "pix", label: "PIX" },
  { value: "avista", label: "À vista" },
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
) as Record<PaymentMethod, string>;

export const INSTALLMENT_STATUS_LABEL: Record<InstallmentStatus, string> = {
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  negado: "Negado",
  pago: "Pago",
};

export const CHANNELS: { value: Channel; label: string; icon: string }[] = [
  { value: "ligacao", label: "Ligação", icon: "phone" },
  { value: "whatsapp", label: "WhatsApp", icon: "message-circle" },
  { value: "email", label: "E-mail", icon: "mail" },
  { value: "presencial", label: "Presencial", icon: "users" },
  { value: "outros", label: "Outros", icon: "message-square" },
];

export const CHANNEL_LABEL: Record<Channel, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.value, c.label]),
) as Record<Channel, string>;

export const DOC_CATEGORIES: { value: DocCategory; label: string }[] = [
  { value: "cnh", label: "CNH" },
  { value: "doc_veiculo", label: "Documento do veículo" },
  { value: "rg", label: "RG / CPF" },
  { value: "contrato", label: "Contrato" },
  { value: "apolice", label: "Apólice (PDF)" },
  { value: "outros", label: "Outros" },
];

export const DOC_CATEGORY_LABEL: Record<DocCategory, string> = Object.fromEntries(
  DOC_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<DocCategory, string>;

// Seguradoras comuns (sugestões em selects)
export const INSURERS = [
  "Porto Seguro",
  "Azul Seguros",
  "Allianz",
  "Bradesco Seguros",
  "SulAmérica",
  "Itaú Seguros",
  "Mapfre",
  "Tokio Marine",
  "HDI Seguros",
  "Liberty Seguros",
  "Zurich",
  "Sompo Seguros",
];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

// Janela (dias) para considerar uma apólice "a vencer" no dashboard/agenda
export const RENEWAL_WINDOW_DAYS = 30;
