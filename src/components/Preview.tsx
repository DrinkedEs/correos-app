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

  return (
    <div className="card">
      <h3>Preview</h3>
      <iframe
        title="preview"
        sandbox=""
        srcDoc={rendered}
        className="preview-frame"
      />
    </div>
  );
}
