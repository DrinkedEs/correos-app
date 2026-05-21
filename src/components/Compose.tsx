import RecipientsField from "./RecipientsField";

type Composed = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  html: string;
};

type Props = {
  value: Composed;
  onChange: (next: Composed) => void;
};

export default function Compose({ value, onChange }: Props) {
  function set<K extends keyof Composed>(k: K, v: Composed[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <section className="card">
      <h2>Mensaje</h2>

      <div className="row">
        <RecipientsField
          label="Para"
          placeholder="Escribe un correo y Enter, o coma..."
          value={value.to}
          onChange={(v) => set("to", v)}
        />
      </div>

      <div className="row two">
        <RecipientsField
          label="CC"
          placeholder="opcional"
          value={value.cc}
          onChange={(v) => set("cc", v)}
        />
        <RecipientsField
          label="CCO"
          placeholder="opcional"
          value={value.bcc}
          onChange={(v) => set("bcc", v)}
        />
      </div>

      <div className="row">
        <label>
          Asunto
          <input
            type="text"
            value={value.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </label>
      </div>

      <div className="row">
        <label>
          HTML
          <textarea
            rows={18}
            value={value.html}
            onChange={(e) => set("html", e.target.value)}
            spellCheck={false}
            placeholder={`<html>\n  <body>\n    <h1>Hola</h1>\n    <img src="cid:logo.png" />\n  </body>\n</html>`}
          />
        </label>
      </div>
    </section>
  );
}
