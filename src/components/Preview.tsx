import { useEffect, useMemo, useState } from "react";

type Props = {
  html: string;
  inlineImages: File[];
};

export default function Preview({ html, inlineImages }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const created: Record<string, string> = {};
    for (const f of inlineImages) {
      created[f.name] = URL.createObjectURL(f);
    }
    setUrls(created);
    return () => {
      for (const url of Object.values(created)) URL.revokeObjectURL(url);
    };
  }, [inlineImages]);

  const rendered = useMemo(() => {
    let out = html;
    for (const [name, url] of Object.entries(urls)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`cid:${escaped}`, "g");
      out = out.replace(re, url);
    }
    return out;
  }, [html, urls]);

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
          sandbox=""
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
