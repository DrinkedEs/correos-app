import { useEffect, useMemo, useRef, useState } from "react";
import type { InlineImage } from "../api/sendEmail";
import { builtInCidUrls } from "../state/builtInAssets";

type Props = {
  html: string;
  inlineImages: InlineImage[];
  onEditHtml?: (html: string) => void;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function replaceCidsInHtml(
  html: string,
  cidToUrl: Map<string, string>
): string {
  if (!html) return html;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(html, "text/html");
  } catch {
    return html;
  }

  doc.querySelectorAll("script,iframe,object,embed").forEach((node) => node.remove());
  const imgs = doc.querySelectorAll("img");
  let touched = true;
  imgs.forEach((img) => {
    const src = img.getAttribute("src") ?? "";
    const m = src.match(/^\s*cid:(.+?)\s*$/i);
    if (!m) return;
    const cid = m[1].trim().toLowerCase();
    const url = cidToUrl.get(cid) ?? builtInCidUrls[cid];
    if (url) {
      img.setAttribute("src", url);
      touched = true;
    }
  });

  if (!touched) return html;
  return "<!DOCTYPE html>" + doc.documentElement.outerHTML;
}

export default function Preview({ html, inlineImages, onEditHtml }: Props) {
  const [byCid, setByCid] = useState<Map<string, string>>(new Map());
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const changedInPreview = useRef(false);
  const [full, setFull] = useState(false);
  const [editing, setEditing] = useState(false);

  function editableRoot(doc: Document): HTMLElement { return doc.getElementById("correo-respuesta") ?? doc.body; }
  function syncFromPreview() {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !onEditHtml || !changedInPreview.current) return;
    const copy = editableRoot(doc).cloneNode(true) as HTMLElement;
    copy.removeAttribute("contenteditable");
    copy.classList.remove("preview-editing");
    copy.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") ?? "";
      const builtIn = Object.entries(builtInCidUrls).find(([, url]) => src === url || src.endsWith(url) || src.includes(`/email-assets/${url.split("/").pop()}`));
      if (builtIn) img.setAttribute("src", `cid:${builtIn[0]}`);
    });
    let html = copy.innerHTML;
    byCid.forEach((dataUrl, cid) => { html = html.split(dataUrl).join(`cid:${cid}`); });
    changedInPreview.current = false;
    onEditHtml(html);
  }
  function insertSnippet(snippet: string) {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !editing) return;
    const root = editableRoot(doc); root.focus();
    doc.execCommand("insertHTML", false, snippet);
    syncFromPreview();
  }
  function configureEditable() {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const root = editableRoot(doc);
    root.contentEditable = editing ? "true" : "false";
    root.classList.toggle("preview-editing", editing);
    root.oninput = editing ? () => { changedInPreview.current = true; } : null;
    root.onblur = editing ? syncFromPreview : null;
  }

  useEffect(() => {
    changedInPreview.current = false;
    configureEditable();
  }, [editing]);

  async function toggleFull() {
    if (!document.fullscreenElement) await cardRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }

  useEffect(() => {
    const change = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        inlineImages.map(
          async (img) => [img.cid.toLowerCase(), await fileToDataUrl(img.file)] as const
        )
      );
      if (cancelled) return;
      setByCid(new Map(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [inlineImages]);

  const rendered = useMemo(
    () => replaceCidsInHtml(html, byCid),
    [html, byCid]
  );

  const hasHtml = html.trim().length > 0;

  return (
    <div ref={cardRef} className={`card preview-card ${full ? "preview-fullscreen" : ""}`}>
      <div className="card-head">
        <h3>Preview</h3>
        <div className="preview-tools"><span className="preview-badge">render del navegador</span>{onEditHtml ? <><button type="button" className={`ghost small ${editing ? "active" : ""}`} onClick={() => setEditing((value) => !value)}>{editing ? "Terminar edición" : "Editar preview"}</button>{editing ? <><button type="button" className="ghost small" onClick={() => insertSnippet("<h2>Título nuevo</h2><p><br></p>")}>+ Título</button><button type="button" className="ghost small" onClick={() => insertSnippet("<p>Texto nuevo</p>")}>+ Texto</button></> : null}</> : null}<button type="button" className="ghost small" onClick={toggleFull}>{full ? "Salir completa" : "Ver completa"}</button></div>
      </div>
      {hasHtml ? (
        <iframe
          ref={frameRef}
          title="preview"
          sandbox="allow-same-origin"
          srcDoc={rendered}
          className="preview-frame"
          onLoad={() => { changedInPreview.current = false; configureEditable(); }}
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
      {editing ? <p className="hint preview-edit-hint">Haz clic en el texto para editarlo. Al hacer clic fuera se actualiza el código HTML.</p> : null}
    </div>
  );
}
