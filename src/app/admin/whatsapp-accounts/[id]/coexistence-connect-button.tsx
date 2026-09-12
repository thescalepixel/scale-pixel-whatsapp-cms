"use client";

import { useEffect, useRef, useState } from "react";
import { completeCoexistenceSignupAction } from "../actions";

// Minimal shape of the bits of the Facebook JS SDK this component actually
// calls — not the full SDK's types.
declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (callback: (response: unknown) => void, params: Record<string, unknown>) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type Props = { accountId: string; wabaId: string; phoneNumberId: string };

type Status =
  | { state: "loading_sdk" }
  | { state: "idle" }
  | { state: "verifying" }
  | { state: "done"; isOnBizApp: boolean }
  | { state: "error"; message: string };

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const CONFIG_ID = process.env.NEXT_PUBLIC_META_WA_CONFIG_ID;

/**
 * Runs Meta's Embedded Signup flow in "connect your existing WhatsApp
 * Business App number" (Coexistence) mode. This is the one thing raw Graph
 * API calls can't do — pairing a number that's still active in someone's
 * WhatsApp Business App phone app to the Cloud API requires this
 * Meta-hosted widget, which does the phone-side handshake itself. Once the
 * widget reports success via postMessage, the actual follow-up API calls
 * (re-subscribe, verify, sync) happen server-side in
 * completeCoexistenceSignupAction — this component only drives the popup
 * and reports its outcome.
 *
 * The Facebook SDK is loaded eagerly on mount (not inside the click
 * handler): FB.login() opens a real popup window, and every major browser
 * only allows that without being blocked when it's called synchronously
 * inside a genuine click event. Deferring the SDK load until the click,
 * then calling FB.login() from an async callback once the script finishes
 * loading, breaks that chain — the browser sees an unrequested popup
 * appearing "out of nowhere" a moment after the click and silently blocks
 * it (no error, nothing happens). Pre-loading means the click handler can
 * call FB.login() immediately and synchronously.
 */
export function CoexistenceConnectButton({ accountId, wabaId, phoneNumberId }: Props) {
  // Starts as "loading_sdk" unconditionally — `window` isn't available
  // during Next.js's server render pass of this client component, so the
  // real check happens in the effect below instead of an initializer here.
  const [status, setStatus] = useState<Status>({ state: "loading_sdk" });
  const sdkInjected = useRef(false);

  useEffect(() => {
    if (window.FB) {
      setStatus({ state: "idle" });
      return;
    }
    if (sdkInjected.current) return;
    sdkInjected.current = true;
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: true, version: "v21.0" });
      setStatus({ state: "idle" });
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.origin.endsWith("facebook.com")) return;
      let data: { type?: string; event?: string; data?: { waba_id?: string; phone_number_id?: string } };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data?.type !== "WA_EMBEDDED_SIGNUP") return;

      if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" || data.event === "FINISH") {
        const returnedWaba = data.data?.waba_id ?? wabaId;
        const returnedPhone = data.data?.phone_number_id ?? phoneNumberId;
        setStatus({ state: "verifying" });
        completeCoexistenceSignupAction(accountId, returnedWaba, returnedPhone)
          .then((res) => setStatus(res.ok ? { state: "done", isOnBizApp: res.isOnBizApp } : { state: "error", message: res.error }))
          .catch(() => setStatus({ state: "error", message: "Something went wrong confirming the pairing." }));
      } else if (data.event === "CANCEL" || data.event === "EXIT") {
        setStatus({ state: "idle" });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [accountId, wabaId, phoneNumberId]);

  function launch() {
    if (!APP_ID || !CONFIG_ID) {
      setStatus({ state: "error", message: "Meta app isn't configured for this yet (missing app/config ID)." });
      return;
    }
    if (!window.FB) {
      setStatus({ state: "error", message: "Still loading Facebook's connector — wait a second and try again." });
      return;
    }
    // Must be called synchronously, right here in the click handler, or the
    // popup gets silently blocked — see the note above.
    window.FB.login(() => {}, {
      config_id: CONFIG_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: { setup: {}, featureType: "whatsapp_business_app_onboarding" },
    });
  }

  const busy = status.state === "loading_sdk" || status.state === "verifying";

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={launch}
        disabled={busy}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {status.state === "loading_sdk" ? "Loading…" : status.state === "verifying" ? "Confirming pairing…" : "Connect WhatsApp Business App"}
      </button>
      {status.state === "idle" && (
        <p className="text-xs text-zinc-400">
          A popup blocked with no error message on screen? Some browsers block it silently — check the address bar for a
          blocked-popup icon, allow popups for this site, and click again.
        </p>
      )}
      {status.state === "done" && (
        <p className="text-sm text-brand-600">
          Paired{status.isOnBizApp ? " — confirmed the number is still linked to the WhatsApp Business App." : "."} Have the
          customer send a test message to confirm it now reaches the inbox.
        </p>
      )}
      {status.state === "error" && <p className="text-sm text-red-600">{status.message}</p>}
    </div>
  );
}
