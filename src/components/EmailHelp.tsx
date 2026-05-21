import { useState } from "react";

type Props = {
  onUseTemplate: (html: string) => void;
};

const RULES_FOR_CLAUDE = `Reglas para generar HTML email-safe (Gmail, Outlook, Apple Mail, Yahoo, Thunderbird):

REQUERIDO:
- Layout SOLO con <table role="presentation" cellpadding="0" cellspacing="0" border="0">. Nunca flex, grid, ni position absolute/fixed.
- TODOS los estilos inline: <td style="..."> en cada celda. No uses <style> en <head> (Outlook lo recorta, Gmail lo procesa parcial).
- Anchos en píxeles fijos (ej 600px max). NO uses vh, vw, %, rem, em pa medidas críticas.
- Doctype: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
- font-family con fallback: "Segoe UI", Arial, Helvetica, sans-serif.
- Tablas anidadas para columnas (no float, no display:inline-block confiable).

PROHIBIDO (ignorado o roto):
- backdrop-filter, filter (blur, drop-shadow)
- animation, transition, @keyframes
- position: absolute/fixed/sticky
- display: flex, grid
- vh, vw, dvh, svh
- clip-path, mask
- @media queries (Gmail mobile las respeta a medias, Outlook desktop NO)
- background-image en <body> (Outlook lo bloquea). Usa background="" attr en <td> o <table> + style fallback.
- @import, web fonts externas (mayoría clients las bloquea).
- Custom properties CSS (--var) — Outlook desktop NO.
- box-shadow, text-shadow (Outlook ignora).
- border-radius (Outlook desktop ignora — usa imágenes si crítico).
- SVG inline (Outlook NO renderea).

ACEPTABLE CON CUIDADO:
- linear-gradient: Apple Mail/iOS SI, Gmail web SI, Outlook desktop NO (usa fallback bgcolor sólido).
- Imágenes: <img src="cid:nombre.png" alt="..." width="..." style="display:block;border:0;" />. Siempre alt, siempre width.
- Botones: <a href="..." style="display:inline-block;background:#156082;color:#fff;padding:14px 28px;text-decoration:none;border-radius:4px;font-weight:bold;">Texto</a>. Outlook desktop ignora border-radius pero igual se ve OK.

ESTRUCTURA RECOMENDADA:
- Wrapper exterior: <table width="100%" bgcolor="#color"> centra contenido.
- Wrapper interior: <table width="600" align="center"> contenido real.
- Cada sección = <tr><td>.
- Espaciado con padding en <td>, NUNCA margin.

OUTPUT: HTML completo con <!DOCTYPE>, <html>, <head> (solo <meta charset>, <meta viewport>, <title>), <body>. Sin <script>. Sin comentarios condicionales de Outlook salvo si lo pido.`;

const BASE_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Título</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef2f7">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#0d4668" style="padding:28px 24px;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:0.5px;">
              ENCABEZADO
            </td>
          </tr>
          <tr>
            <td align="center" bgcolor="#156082" style="padding:16px 24px;color:#ffffff;font-size:16px;">
              Subtítulo
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;color:#1f2933;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 14px;">Hola equipo,</p>
              <p style="margin:0 0 14px;">Cuerpo principal del mensaje. Puedes incluir <b>negritas</b>, <a href="#" style="color:#156082;">enlaces</a>, y tablas:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:8px 0 16px;">
                <tr>
                  <th bgcolor="#156082" style="padding:10px;color:#fff;font-size:13px;text-align:left;border:1px solid #0d4668;">Columna A</th>
                  <th bgcolor="#156082" style="padding:10px;color:#fff;font-size:13px;text-align:left;border:1px solid #0d4668;">Columna B</th>
                </tr>
                <tr>
                  <td style="padding:10px;font-size:14px;border:1px solid #e2e8f0;">Valor 1</td>
                  <td style="padding:10px;font-size:14px;border:1px solid #e2e8f0;">Valor 2</td>
                </tr>
              </table>
              <p style="margin:0 0 18px;">Saludos.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td bgcolor="#156082" style="border-radius:6px;">
                    <a href="https://example.com" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;">Call to action</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f8fafc" style="padding:16px 24px;color:#6b7280;font-size:12px;text-align:center;border-top:1px solid #e2e8f0;">
              Pie de página — generado automáticamente
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export default function EmailHelp({ onUseTemplate }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyRules() {
    try {
      await navigator.clipboard.writeText(RULES_FOR_CLAUDE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="card help-card">
      <button
        type="button"
        className="help-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="help-icon">?</span>
        <span className="help-title">Ayuda — HTML email-safe</span>
        <span className="help-chevron">{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className="help-body">
          <p className="hint">
            Los clientes de correo (Gmail, Outlook, etc.) NO renderean igual
            que browser. Usa estas reglas o pide a Claude que respete las
            restricciones de abajo.
          </p>

          <div className="help-actions">
            <button type="button" className="primary small" onClick={copyRules}>
              {copied ? "✓ Copiado" : "Copiar reglas pa Claude"}
            </button>
            <button
              type="button"
              className="ghost small"
              onClick={() => onUseTemplate(BASE_TEMPLATE)}
            >
              Insertar plantilla base
            </button>
          </div>

          <div className="help-grid">
            <div>
              <h4 className="ok-h">✅ Sí funciona</h4>
              <ul className="help-list">
                <li>Layout con &lt;table&gt;</li>
                <li>Estilos inline en cada &lt;td&gt;</li>
                <li>Anchos fijos en px (max 600)</li>
                <li>Colores planos, bgcolor en td</li>
                <li>Imágenes con <code>cid:</code></li>
                <li>Links con padding (botones)</li>
                <li>Fuentes sistema (Arial, Segoe UI)</li>
              </ul>
            </div>
            <div>
              <h4 className="err-h">❌ No funciona / se rompe</h4>
              <ul className="help-list">
                <li>flex, grid, position absolute</li>
                <li>animation, transition, @keyframes</li>
                <li>backdrop-filter, filter, blur</li>
                <li>vh, vw, dvh</li>
                <li>box-shadow, text-shadow (Outlook)</li>
                <li>border-radius (Outlook desktop)</li>
                <li>@media queries (Outlook)</li>
                <li>Custom props CSS (--var)</li>
                <li>SVG inline (Outlook)</li>
                <li>Web fonts externas</li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
