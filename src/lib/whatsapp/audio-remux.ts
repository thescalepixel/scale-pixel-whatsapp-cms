import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";

const execFileAsync = promisify(execFile);

/**
 * WhatsApp's Cloud API only accepts audio/ogg (Opus codec) for voice notes
 * — audio/webm (what MediaRecorder produces in every Chromium browser;
 * Firefox is the only one that can record straight to Ogg/Opus) is rejected
 * outright. The Opus audio itself doesn't need re-encoding, only rewrapping
 * into an Ogg container, so this is a fast stream-copy remux, not a
 * transcode.
 *
 * Discovered via a real send that silently failed: a voice note recorded in
 * Chrome reached uploadMediaToWhatsApp() as audio/webm, Meta's /media
 * endpoint rejected it, and the message just sat at status "failed" with no
 * indication why.
 */
export async function remuxToOggOpus(
  input: ArrayBuffer,
): Promise<{ ok: true; bytes: ArrayBuffer } | { ok: false; error: string }> {
  const dir = await mkdtemp(join(tmpdir(), "wa-audio-"));
  const inputPath = join(dir, "input.webm");
  const outputPath = join(dir, "output.ogg");
  try {
    await writeFile(inputPath, Buffer.from(input));
    await execFileAsync(ffmpegPath.path, [
      "-y",
      "-i", inputPath,
      "-c:a", "copy",
      "-vn",
      outputPath,
    ]);
    const output = await readFile(outputPath);
    // Slice out just this buffer's own bytes — Node may hand back a Buffer
    // backed by a larger pooled ArrayBuffer, so .buffer alone isn't safe.
    const arrayBuffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
    return { ok: true, bytes: arrayBuffer };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ffmpeg remux failed" };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
