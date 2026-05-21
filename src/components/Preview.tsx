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

  const rendered = useMemo(() => {
    let out = html;
    for (const [name, url] of Object.entries(dataUrls)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`cid:${escaped}`, "g");
      out = out.replace(re, url);
    }
    return out;
  }, [html, dataUrls]);

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
