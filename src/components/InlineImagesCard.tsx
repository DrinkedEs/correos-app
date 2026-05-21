import { useRef, useState } from "react";
import type { InlineImage } from "../api/sendEmail";

type Props = {
  images: InlineImage[];
  onChange: (next: InlineImage[]) => void;
};

function sanitizeCid(raw: string): string {
  return raw.replace(/[^A-Za-z0-9._@-]/g, "_").slice(0, 80);
}

function defaultCidFor(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const cleaned = sanitizeCid(base) || sanitizeCid(name) || "img";
  return `${cleaned}_id`;
}

function buildClipboard(list: InlineImage[]): string {
  if (list.length === 0) return "";
  const lines = list
    .map(
      (i) =>
        `- archivo "${i.file.name}" → usar <img src="cid:${i.cid}" alt="..." style="display:block;border:0;" />`
    )
    .join("\n");
  return `Imágenes inline disponibles (referencia con cid:CID exactamente como aparece):\n${lines}`;
}

export default function InlineImagesCard({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  function add(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const merged = [...images];
    for (const f of incoming) {
      const dupIdx = merged.findIndex(
        (x) => x.file.name === f.name && x.file.size === f.size
      );
      if (dupIdx >= 0) {
        merged[dupIdx] = { file: f, cid: merged[dupIdx].cid };
      } else {
        merged.push({ file: f, cid: defaultCidFor(f.name) });
      }
    }
    onChange(merged);
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function setCid(idx: number, raw: string) {
    const next = [...images];
    next[idx] = { ...next[idx], cid: sanitizeCid(raw) };
    onChange(next);
  }

  async function copyHint() {
    try {
      await navigator.clipboard.writeText(buildClipboard(images));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Imágenes inline</h3>
        {images.length > 0 ? (
          <button type="button" className="ghost small" onClick={copyHint}>
            {copied ? "✓ Copiado" : "Copiar nombres pa Claude"}
          </button>
        ) : null}
      </div>
      <p className="hint">
        Sube y referencia con <code className="cid-hint">&lt;img src=&quot;cid:CID&quot;&gt;</code>.
        Puedes renombrar el CID (default: <code>nombre_id</code>). El correo
        embebe la imagen con ese ContentId, igual que tu código C#.
      </p>

      <div
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          add(e.dataTransfer.files);
        }}
      >
        <span>Arrastra imágenes o haz click</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 ? (
        <ul className="inline-list">
          {images.map((img, i) => (
            <li key={`${img.file.name}-${i}`}>
              <div className="inline-row-main">
                <div className="inline-meta">
                  <b className="inline-fname" title={img.file.name}>
                    {img.file.name}
                  </b>
                  <span className="muted">
                    ({Math.round(img.file.size / 1024)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost small"
                  onClick={() => remove(i)}
                >
                  Quitar
                </button>
              </div>
              <label className="inline-cid">
                CID
                <input
                  type="text"
                  value={img.cid}
                  onChange={(e) => setCid(i, e.target.value)}
                  spellCheck={false}
                  placeholder="firma_id"
                />
                <code className="cid-hint">{`<img src="cid:${img.cid}">`}</code>
              </label>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
