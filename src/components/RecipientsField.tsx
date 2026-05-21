import { useEffect, useMemo, useRef, useState } from "react";
import {
  joinCsv,
  parseCsv,
  removeContact,
  suggestContacts
} from "../state/contacts";

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (csv: string) => void;
};

export default function RecipientsField({
  label,
  placeholder,
  value,
  onChange
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const chips = useMemo(() => parseCsv(value), [value]);

  const suggestions = useMemo(
    () => suggestContacts(query, chips, 10),
    [query, chips, version]
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function removeChip(idx: number) {
    const next = chips.filter((_, i) => i !== idx);
    onChange(joinCsv(next));
  }

  function addEmail(email: string) {
    const v = email.trim();
    if (!v) return;
    if (chips.includes(v)) return;
    onChange(joinCsv([...chips, v]));
    setQuery("");
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
      if (query.trim().length === 0) return;
      e.preventDefault();
      addEmail(query);
    } else if (e.key === "Backspace" && query.length === 0 && chips.length > 0) {
      removeChip(chips.length - 1);
    }
  }

  function handleRemoveFromHistory(email: string) {
    removeContact(email);
    setVersion((v) => v + 1);
  }

  return (
    <label className="rf-label">
      {label}
      <div
        ref={containerRef}
        className={`rf-wrap ${open ? "open" : ""}`}
      >
        <div
          className="rf-input-area"
          onClick={() =>
            containerRef.current?.querySelector("input")?.focus()
          }
        >
          {chips.map((c, i) => (
            <span key={`${c}-${i}`} className="chip">
              {c}
              <button
                type="button"
                className="chip-x"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(i);
                }}
                aria-label={`Quitar ${c}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={query}
            placeholder={chips.length === 0 ? (placeholder ?? "") : ""}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            onBlur={() => {
              if (query.trim().length > 0) addEmail(query);
            }}
            autoComplete="off"
          />
        </div>

        {open && suggestions.length > 0 ? (
          <ul className="rf-suggest">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="rf-pick"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addEmail(s);
                  }}
                >
                  <span className="rf-pick-email">{s}</span>
                </button>
                <button
                  type="button"
                  className="rf-pick-x"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleRemoveFromHistory(s);
                  }}
                  aria-label={`Quitar ${s} del historial`}
                  title="Quitar del historial"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </label>
  );
}
