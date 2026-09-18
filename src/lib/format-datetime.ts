const UAE_TIME_ZONE = "Asia/Dubai";

/**
 * Every timestamp in the app should read the same UAE wall-clock time
 * (Gulf Standard Time, UTC+4, no DST) no matter where it renders — a plain
 * `.toLocaleString()` instead follows whatever timezone the *renderer*
 * happens to be in, which for a Server Component is Vercel's UTC runtime
 * and for a Client Component is the viewer's own browser/OS setting. Both
 * silently disagree with each other and with the business's actual
 * timezone, so every call site should go through this instead of calling
 * `.toLocaleString()` directly.
 */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-US", { timeZone: UAE_TIME_ZONE });
}
