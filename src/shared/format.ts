// Helpers de formatação e datas. Datas são strings 'YYYY-MM-DD'.
import type { InstallmentStatus } from "./types";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number | null | undefined): string {
  return BRL.format(Number(value ?? 0));
}

/** Versão compacta: R$ 19,1k / R$ 3,2k */
export function formatBRLCompact(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1000) {
    return `R$ ${(n / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}k`;
  }
  return formatBRL(n);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseISO(iso: string): Date {
  // Interpreta como data local (evita deslocamento de fuso)
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso.slice(0, 10));
  return d.toLocaleDateString("pt-BR");
}

const LONG_FMT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

/** "domingo, 28 de junho" */
export function formatDateLong(date = new Date()): string {
  return LONG_FMT.format(date);
}

/** Dias entre hoje e a data (positivo = futuro, negativo = passado). */
export function daysUntil(iso: string | null | undefined): number {
  if (!iso) return Infinity;
  const today = parseISO(todayISO());
  const target = parseISO(iso.slice(0, 10));
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** Texto relativo de vencimento: "Venceu há 5d", "Hoje", "12 dias". */
export function dueLabel(iso: string | null | undefined): string {
  const d = daysUntil(iso);
  if (!isFinite(d)) return "—";
  if (d < 0) return `Venceu há ${Math.abs(d)}d`;
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  return `${d} dias`;
}

export function addMonthsISO(iso: string, months: number): string {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function addYearsISO(iso: string, years: number): string {
  const d = parseISO(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/** 'YYYY-MM' do mês atual ou de uma data. */
export function monthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

/** Status efetivo de uma parcela: marca como atrasada se vencida e não paga. */
export function effectiveInstallmentStatus(i: {
  status: InstallmentStatus;
  due_date: string;
}): InstallmentStatus {
  if (i.status === "paga") return "paga";
  return daysUntil(i.due_date) < 0 ? "atrasada" : "pendente";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Saudação conforme o horário. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
