import { useEffect, useMemo, useState } from "react";

type Props = {
  html: string;
  inlineImages: File[];
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function replaceCidsInHtml(html: string, urls: Record<string, string>): string {
  if (!html) return html;
  if (Object.keys(urls).length === 0) return html;

  const lookup = new Map<string, string>();
  for (const [k, v] of Object.entries(urls)) {
    lookup.set(k.toLowerCase(), v);
  }

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch {
    return html;
  }

  const imgs = doc.querySelectorAll("img");
  let touched = false;
  imgs.forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    const m = src.match(/^\s*cid:(.+?)\s*$/i);
    if (!m) return;
    const cid = m[1].trim().toLowerCase();
    const url = lookup.get(cid);
    if (url) {
      img.setAttribute("src", url);
      touched = true;
    }
  });

  if (!touched) {
    return html;
  }

  return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
}

export default function Preview({ html, inlineImages }: Props) {
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        inlineImages.map(async (f) => [f.name, await fileToDataUrl(f)] as const)
      );
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [k, v] of entries) next[k] = v;
      setDataUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [inlineImages]);

  const rendered = useMemo(
    () => replaceCidsInHtml(html, dataUrls),
    [html, dataUrls]
  );

  const hasHtml = html.trim().length > 0;

  return (
    <div className="card preview-card">
      <div className="card-head">
        <h3>Preview</h3>
        <span className="preview-badge">render del navegador</span>
      </div>
      {hasHtml ? (
        <iframe
          title="preview"
          sandbox="allow-same-origin"
          srcDoc={rendered}
          className="preview-frame"
        />
      ) : (
        <div className="preview-empty">
          <div className="preview-empty-icon">✉</div>
          <div className="preview-empty-text">
            Escribe HTML en el formulario o inserta la plantilla base desde el
            panel de Ayuda.
          </div>
        </div>
      )}
      <p className="hint">
        Lo que ves aquí usa el motor del browser. Gmail/Outlook puede ignorar
        flex, animations, backdrop-filter, vh, etc. Mira la ayuda.
      </p>
    </div>
  );
}
