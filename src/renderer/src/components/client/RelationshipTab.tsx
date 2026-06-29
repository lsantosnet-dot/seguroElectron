import { useState } from "react";
import { Loader2, Send, Trash2, MessagesSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useRefresh } from "@/lib/data";
import { CHANNELS, CHANNEL_LABEL } from "@shared/constants";
import { DynIcon } from "@/components/DynIcon";
import { EmptyState } from "@/components/ui";
import { formatDate } from "@shared/format";
import type { Channel, Comment } from "@shared/types";

const CHANNEL_ICON: Record<Channel, string> = {
  ligacao: "phone",
  whatsapp: "message-circle",
  email: "mail",
  presencial: "users",
  outros: "message-square",
};

export function RelationshipTab({
  clientId,
  comments,
}: {
  clientId: string;
  comments: Comment[];
}) {
  const refresh = useRefresh();
  const [pending, setPending] = useState(false);
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [body, setBody] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    await api.addComment(clientId, channel, body);
    setBody("");
    setPending(false);
    refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="card space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setChannel(c.value)}
              className={`badge ${channel === c.value ? "badge-green" : "badge-gray"} cursor-pointer`}
            >
              <DynIcon name={c.icon} size={13} /> {c.label}
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-20"
          placeholder="Registrar um contato ou observação de relacionamento…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex justify-end">
          <button className="btn btn-primary" disabled={pending || !body.trim()}>
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Registrar
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={24} />}
          title="Sem registros de relacionamento"
          description="Anote ligações, mensagens e observações importantes do cliente."
        />
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="card flex gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <DynIcon name={CHANNEL_ICON[c.channel]} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{CHANNEL_LABEL[c.channel]}</span>
                  <span className="num text-xs text-faint">{formatDate(c.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{c.body}</p>
              </div>
              <DeleteBtn id={c.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeleteBtn({ id }: { id: string }) {
  const refresh = useRefresh();
  const [pending, setPending] = useState(false);
  return (
    <button
      className="text-faint hover:text-danger"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await api.deleteComment(id);
        setPending(false);
        refresh();
      }}
      title="Excluir"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
    </button>
  );
}
