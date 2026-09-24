import type { InlineImage } from "../api/sendEmail";
const ASSETS = [
  ["firma.jpg", "firma_id"],
  ["logo.png", "logo_id"],
  ["logoForesight_chico.png", "logoForesight_chico_id"]
] as const;
export const builtInCidUrls: Record<string, string> = Object.fromEntries(
  ASSETS.map(([name, cid]) => [cid.toLowerCase(), `${import.meta.env.BASE_URL}email-assets/${name}`])
);
export async function builtInImages(): Promise<InlineImage[]> {
  return Promise.all(ASSETS.map(async ([name, cid]) => {
    const blob = await fetch(`${import.meta.env.BASE_URL}email-assets/${name}`).then(r => r.blob());
    return { file: new File([blob], name, { type: blob.type || "application/octet-stream" }), cid };
  }));
}
export const signatureHtml = `<br><br><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center"><img src="cid:firma_id" alt="Firma" width="220" style="display:block;border:0;width:220px;height:auto;"></td></tr></table>`;
