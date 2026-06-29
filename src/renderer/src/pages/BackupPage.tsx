import { BackupClient } from "@/components/BackupClient";

export function BackupPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Backup</h1>
      <p className="mb-6 text-sm text-muted">
        Exporte e importe toda a sua base de dados em formato JSON.
      </p>
      <BackupClient />
    </div>
  );
}
