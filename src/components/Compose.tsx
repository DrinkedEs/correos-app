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
        <label>
          Para (CSV)
          <input
            type="text"
            placeholder="a@x.com, b@y.com"
            value={value.to}
            onChange={(e) => set("to", e.target.value)}
          />
        </label>
      </div>

      <div className="row two">
        <label>
          CC (opcional)
          <input
            type="text"
            value={value.cc}
            onChange={(e) => set("cc", e.target.value)}
          />
        </label>
        <label>
          BCC (opcional)
          <input
            type="text"
            value={value.bcc}
            onChange={(e) => set("bcc", e.target.value)}
          />
        </label>
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
            rows={16}
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
