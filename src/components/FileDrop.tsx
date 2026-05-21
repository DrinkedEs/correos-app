import { useRef, useState } from "react";

type Props = {
  label: string;
  hint?: string;
  files: File[];
  accept?: string;
  onChange: (files: File[]) => void;
  renderItemHint?: (f: File) => string;
  copyForClaude?: (files: File[]) => string;
};

export default function FileDrop({
  label,
  hint,
  files,
  accept,
  onChange,
  renderItemHint,
  copyForClaude
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  function add(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const merged = [...files];
    for (const f of incoming) {
      const dupIdx = merged.findIndex(
        (x) => x.name === f.name && x.size === f.size
      );
      if (dupIdx >= 0) merged[dupIdx] = f;
      else merged.push(f);
    }
    onChange(merged);
  }

  function remove(idx: number) {
    onChange(files.filter((_, i) => i !== idx));
  }

  async function copyHint() {
    if (!copyForClaude) return;
    try {
      await navigator.clipboard.writeText(copyForClaude(files));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>{label}</h3>
        {copyForClaude && files.length > 0 ? (
          <button type="button" className="ghost small" onClick={copyHint}>
            {copied ? "✓ Copiado" : "Copiar nombres pa Claude"}
          </button>
        ) : null}
      </div>
      {hint ? <p className="hint">{hint}</p> : null}

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
        <span>Arrastra archivos aquí o haz click</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="file-list">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              <span>
                <b>{f.name}</b>
                <span className="muted"> ({Math.round(f.size / 1024)} KB)</span>
              </span>
              {renderItemHint ? (
                <code className="cid-hint">{renderItemHint(f)}</code>
              ) : null}
              <button
                type="button"
                className="ghost small"
                onClick={() => remove(i)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
