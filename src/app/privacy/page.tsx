export const metadata = {
  title: "Privacy Policy — Scale Pixel",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-zinc-800 dark:text-zinc-200">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white font-semibold">
          SP
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Scale Pixel</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Privacy Policy</p>
      </div>

      <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 text-sm leading-relaxed shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <section>
          <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">What this is</h2>
          <p>
            This is an internal Conversation Management System used by Scale Pixel and its
            clients to manage WhatsApp Business conversations on behalf of their own customers.
            It is not a public consumer product — access is restricted to authorized admin,
            supervisor, client, and employee accounts created by an administrator.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">What information we process</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>WhatsApp messages, phone numbers, and profile names of customers who message a connected WhatsApp Business number, delivered to us via the Meta WhatsApp Cloud API.</li>
            <li>Account information for platform users (name, email, role) created by an administrator.</li>
            <li>Activity and audit logs of actions taken within the platform, for security and accountability.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">How it&apos;s used</h2>
          <p>
            Data is used solely to display, route, and respond to WhatsApp conversations within
            each client&apos;s own isolated workspace, and to operate the platform (assignment,
            notifications, reporting, and audit logging). We do not sell data or share it with
            third parties beyond the Meta WhatsApp Business Platform required to send and receive
            messages.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Storage &amp; security</h2>
          <p>
            Data is stored in a managed Postgres database (Supabase) with row-level access
            controls enforcing that each client can only see their own data. Sensitive
            credentials (WhatsApp access tokens) are encrypted at rest.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Data retention &amp; deletion</h2>
          <p>
            Conversation data is retained for as long as the client relationship is active, or as
            required for legitimate business/legal purposes. To request deletion of your data,
            contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">Contact</h2>
          <p>
            Questions about this policy or your data can be sent to{" "}
            <a className="text-emerald-600 hover:underline" href="mailto:thescalepixel@gmail.com">
              thescalepixel@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
