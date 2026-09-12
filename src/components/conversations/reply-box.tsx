"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessageAction, sendMediaMessageAction } from "@/lib/conversations/actions";

type Mode =
  | { kind: "idle" }
  | { kind: "file"; file: File; previewUrl: string | null }
  | { kind: "recording" }
  | { kind: "recorded"; blob: Blob; previewUrl: string; seconds: number };

const MAX_MB: Record<string, number> = { image: 5, video: 16 };

export function ReplyBox({ conversationId }: { conversationId: string }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (mode.kind === "file" && mode.previewUrl) URL.revokeObjectURL(mode.previewUrl);
      if (mode.kind === "recorded") URL.revokeObjectURL(mode.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetToIdle() {
    if (mode.kind === "file" && mode.previewUrl) URL.revokeObjectURL(mode.previewUrl);
    if (mode.kind === "recorded") URL.revokeObjectURL(mode.previewUrl);
    setMode({ kind: "idle" });
    setCaption("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onFileChosen(file: File) {
    setError(null);
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null;
    const capMb = kind ? MAX_MB[kind] : 16;
    if (file.size > capMb * 1024 * 1024) {
      setError(`That file is too large (max ${capMb}MB).`);
      return;
    }
    const previewUrl = kind ? URL.createObjectURL(file) : null;
    setMode({ kind: "file", file, previewUrl });
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm"].find((t) =>
        typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(t),
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setMode((prev) =>
          prev.kind === "recording"
            ? { kind: "recorded", blob, previewUrl: URL.createObjectURL(blob), seconds: recordSeconds }
            : prev,
        );
        if (timerRef.current) clearInterval(timerRef.current);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      setMode({ kind: "recording" });
    } catch {
      setError("Couldn't access the microphone — check your browser's permission for this site.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function sendCurrent() {
    const fd = new FormData();
    if (mode.kind === "file") {
      fd.set("file", mode.file);
    } else if (mode.kind === "recorded") {
      const ext = mode.blob.type.includes("ogg") ? "ogg" : "webm";
      fd.set("file", mode.blob, `voice-note.${ext}`);
    } else {
      return;
    }
    if (caption.trim()) fd.set("caption", caption.trim());

    startTransition(async () => {
      const res = await sendMediaMessageAction(conversationId, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      resetToIdle();
    });
  }

  if (mode.kind === "recording") {
    return (
      <div className="flex items-center gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <span className="live-dot inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" style={{ ["--live-dot-color" as string]: "#ef4444" }} />
        <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Recording… {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:{String(recordSeconds % 60).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={stopRecording}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Stop
        </button>
      </div>
    );
  }

  if (mode.kind === "file" || mode.kind === "recorded") {
    return (
      <div className="animate-slide-up space-y-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
          {mode.kind === "file" && mode.previewUrl && mode.file.type.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mode.previewUrl} alt="" className="h-14 w-14 rounded object-cover" />
          )}
          {mode.kind === "file" && mode.previewUrl && mode.file.type.startsWith("video/") && (
            <video src={mode.previewUrl} className="h-14 w-14 rounded object-cover" muted />
          )}
          {mode.kind === "file" && !mode.previewUrl && (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-800">
              FILE
            </span>
          )}
          {mode.kind === "recorded" && <audio src={mode.previewUrl} controls className="h-10 flex-1" />}
          {mode.kind === "file" && (
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">{mode.file.name}</span>
          )}
          <button
            type="button"
            onClick={resetToIdle}
            disabled={pending}
            className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Discard
          </button>
        </div>
        {mode.kind === "file" && (
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)…"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
          />
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={sendCurrent}
            disabled={pending}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await sendMessageAction(conversationId, formData);
          formRef.current?.reset();
        });
      }}
      className="flex items-end gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileChosen(f);
        }}
      />
      <button
        type="button"
        title="Attach a photo or video"
        onClick={() => fileInputRef.current?.click()}
        disabled={pending}
        className="shrink-0 rounded-md border border-zinc-300 p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.667 3.667 0 0 1 5.19 5.19l-9.2 9.19a1.833 1.833 0 0 1-2.59-2.59l8.49-8.48"
          />
        </svg>
      </button>
      <button
        type="button"
        title="Record a voice message"
        onClick={startRecording}
        disabled={pending}
        className="shrink-0 rounded-md border border-zinc-300 p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-14 0M12 18v3" />
        </svg>
      </button>
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Type a reply…"
        className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
