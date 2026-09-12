import type { MessageRow } from "@/lib/conversations/types";

export function MessageThread({ messages }: { messages: MessageRow[] }) {
  if (messages.length === 0) {
    return <p className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No messages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-6">
      {messages.map((m) => {
        const isOut = m.direction === "out";
        return (
          <div key={m.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                isOut
                  ? "rounded-br-sm bg-brand-600 text-white"
                  : "rounded-bl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[10px] ${isOut ? "text-brand-100" : "text-zinc-400"}`}>
                {new Date(m.created_at).toLocaleString()}
                {isOut && ` · ${m.status}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
