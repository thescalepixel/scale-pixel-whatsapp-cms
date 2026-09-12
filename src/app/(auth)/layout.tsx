export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white font-semibold shadow-sm shadow-brand-900/20">
            SP
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Scale Pixel
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            WhatsApp Conversation Management
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {children}
        </div>
      </div>
    </div>
  );
}
