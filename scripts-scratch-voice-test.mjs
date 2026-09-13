// THROWAWAY test script — deleted immediately after use.
// Exercises the exact real code path (remux -> Storage -> Meta /media ->
// Meta /messages -> messages insert) that a live Chrome voice-note send
// goes through, using a synthetic webm/opus file instead of a real mic
// recording (this sandbox has no microphone).
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const execFileAsync = promisify(execFile);

function loadEnvLocal() {
  const text = readFileSync(new URL("./.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

function decryptToken(stored) {
  const [ivHex, authTagHex, dataHex] = stored.split(":");
  const key = Buffer.from(process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CONVERSATION_ID = "d3ec6b5a-731e-4a4f-a34c-730a154a733a";
const GRAPH = "https://graph.facebook.com/v21.0";

async function main() {
  const { data: conv, error: convErr } = await admin
    .from("conversations")
    .select("id, customer:customer_id ( whatsapp_number ), whatsapp_account:whatsapp_account_id ( id, phone_number_id, access_token_encrypted, status )")
    .eq("id", CONVERSATION_ID)
    .single();
  if (convErr) throw convErr;
  const account = conv.whatsapp_account;
  const customer = conv.customer;
  console.log("Account:", account.phone_number_id, account.status);
  console.log("Customer:", customer.whatsapp_number);

  const accessToken = decryptToken(account.access_token_encrypted);

  // 1. Remux the synthetic webm/opus file to ogg, exactly like audio-remux.ts
  const ffmpegPath = (await import("@ffmpeg-installer/ffmpeg")).default.path;
  const inputPath = join(process.cwd(), "..", "scratchpad-input-placeholder"); // unused
  const srcPath = process.argv[2];
  if (!srcPath) throw new Error("Pass the source webm path as argv[2]");
  const dir = await mkdtemp(join(tmpdir(), "wa-audio-test-"));
  const remuxIn = join(dir, "input.webm");
  const remuxOut = join(dir, "output.ogg");
  await writeFile(remuxIn, await readFile(srcPath));
  await execFileAsync(ffmpegPath, ["-y", "-i", remuxIn, "-c:a", "copy", "-vn", remuxOut]);
  const oggBytes = await readFile(remuxOut);
  console.log("Remuxed ogg size:", oggBytes.length, "bytes");
  await rm(dir, { recursive: true, force: true }).catch(() => {});

  // 2. Store our own permanent copy (mirrors sendMediaMessageAction)
  const messageId = crypto.randomUUID();
  const path = `conv/${CONVERSATION_ID}/${messageId}.ogg`;
  const { error: uploadErr } = await admin.storage.from("whatsapp-media").upload(path, oggBytes, {
    contentType: "audio/ogg",
    upsert: false,
  });
  if (uploadErr) throw uploadErr;
  console.log("Stored at:", path);

  // 3. Upload to Meta /media
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", new Blob([oggBytes], { type: "audio/ogg" }), "upload");
  form.append("type", "audio/ogg");
  const uploadRes = await fetch(`${GRAPH}/${account.phone_number_id}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const uploadData = await uploadRes.json();
  console.log("Meta /media response:", uploadRes.status, JSON.stringify(uploadData));
  if (!uploadRes.ok || !uploadData?.id) {
    console.error("UPLOAD FAILED — this is the real bug still reproducing.");
    process.exit(1);
  }

  // 4. Send as an audio message
  const sendRes = await fetch(`${GRAPH}/${account.phone_number_id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: customer.whatsapp_number,
      type: "audio",
      audio: { id: uploadData.id },
    }),
  });
  const sendData = await sendRes.json();
  console.log("Meta /messages response:", sendRes.status, JSON.stringify(sendData));
  const whatsappMessageId = sendData?.messages?.[0]?.id ?? null;
  const status = sendRes.ok ? "sent" : "failed";

  // 5. Insert the message row so it shows up in the real thread too
  const { error: insertErr } = await admin.from("messages").insert({
    id: messageId,
    conversation_id: CONVERSATION_ID,
    direction: "out",
    sender_type: "employee",
    sender_id: null,
    body: "[automated remux test]",
    status,
    whatsapp_message_id: whatsappMessageId,
    media_type: "audio",
    media_path: path,
    media_mime_type: "audio/ogg",
    media_filename: null,
  });
  if (insertErr) console.error("Insert error (non-fatal for the test itself):", insertErr);
  else console.log("Message row inserted, status:", status);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
