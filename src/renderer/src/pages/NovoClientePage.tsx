import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ClientForm } from "@/components/ClientForm";

export function NovoClientePage() {
  return (
    <div>
      <Link
        to="/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <ChevronLeft size={16} /> Clientes
      </Link>
      <h1 className="mb-6 text-2xl font-bold">Novo cliente</h1>
      <ClientForm />
    </div>
  );
}
