import type { InlineImage } from "../api/sendEmail";
const ASSETS = [
  ["firma.jpg", "firma_id"],
  ["logo.png", "logo_id"],
  ["logoForesight_chico.ico", "logoForesight_chico_id"]
] as const;
export async function builtInImages(): Promise<InlineImage[]> {
  return Promise.all(ASSETS.map(async ([name, cid]) => {
    const blob = await fetch(`${import.meta.env.BASE_URL}email-assets/${name}`).then(r => r.blob());
    return { file: new File([blob], name, { type: blob.type || "application/octet-stream" }), cid };
  }));
}
export const signatureHtml = `<br><br><img src="cid:firma_id" alt="Firma"><br><img src="cid:logo_id" alt="Logo">`;
