import { useState } from "react";
import { deleteGroup, loadGroups, parseCsv, saveGroup, type ContactGroup } from "../state/contacts";

export default function GroupsCard({ onPick }: { onPick: (emails: string[]) => void }) {
  const [groups, setGroups] = useState<ContactGroup[]>(loadGroups());
  const [name, setName] = useState(""); const [emails, setEmails] = useState("");
  function refresh() { setGroups(loadGroups()); }
  function add() { saveGroup(name, parseCsv(emails)); setName(""); setEmails(""); refresh(); }
  return <section className="card groups-card"><div className="card-head"><h2>Grupos rápidos</h2></div>
    <div className="group-create"><input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Gerentes" /><input value={emails} onChange={e => setEmails(e.target.value)} placeholder="correo1@..., correo2@..." /><button className="ghost small" type="button" onClick={add}>Guardar grupo</button></div>
    {groups.length ? <div className="group-list">{groups.map(group => <div className="group-item" key={group.id}><button type="button" className="group-pick" onClick={() => onPick(group.emails)}>{group.name}<small>{group.emails.length} correos</small></button><button type="button" className="rf-pick-x" onClick={() => { deleteGroup(group.id); refresh(); }} title="Eliminar grupo">✕</button></div>)}</div> : <p className="hint">Guarda destinatarios frecuentes y agrégalos a Para con un clic.</p>}
  </section>;
}
