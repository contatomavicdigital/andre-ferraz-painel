import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "./supabase";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  beige: "#F5F0E8", beigeDeep: "#EDE5D4", white: "#FFFFFF",
  green: "#2D5016", greenMid: "#3D6B1F", greenLight: "#4A7C25",
  gold: "#C9A84C", goldLight: "#E2C070",
  gray: "#6B7280", grayLight: "#D1C9B8", text: "#2C2C2C",
};

const CATALOG = [
  "Imersão","Gravação","Pele de Pétalas","Master em Aromaterapia",
  "Saúde em Gotas","Mentoria","Curso Online","Ebook",
];

const fmt = (v) => (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "0%");

const css = {
  card: { background: T.white, borderRadius: 16, boxShadow: "0 2px 16px rgba(45,80,22,0.07)", padding: "24px 28px", border: `1px solid ${T.grayLight}` },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gray, fontFamily: "'DM Sans', sans-serif" },
  h1: { fontFamily: "'Cormorant Garamond', serif", color: T.green, fontWeight: 600 },
  h2: { fontFamily: "'Cormorant Garamond', serif", color: T.text, fontWeight: 600 },
  body: { fontFamily: "'DM Sans', sans-serif", color: T.text },
};

const PALETTE = [T.green, T.gold, T.greenLight, T.goldLight, "#A0845C", "#8B6914", "#5C7A2D", "#C4873A"];

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, gold }) {
  return (
    <div style={{ ...css.card, borderTop: `3px solid ${gold ? T.gold : T.green}`, minWidth: 140, flex: 1 }}>
      <div style={css.label}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: gold ? T.gold : T.green, fontFamily: "'Cormorant Garamond', serif", marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.gray, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 3, height: 22, background: `linear-gradient(${T.green}, ${T.gold})`, borderRadius: 2 }} />
      <h2 style={{ ...css.h2, fontSize: 18, margin: 0 }}>{children}</h2>
    </div>
  );
}

function ProductPill({ nome, qty, onRemove, onQty }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${T.green}10`, border: `1.5px solid ${T.green}25`, borderRadius: 24, padding: "6px 10px 6px 14px", fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ color: T.green, fontWeight: 600, fontSize: 13 }}>{nome}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 6 }}>
        <button onClick={() => onQty(Math.max(1, qty - 1))} style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${T.grayLight}`, background: T.white, cursor: "pointer", color: T.gray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>−</button>
        <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700, color: T.green, fontSize: 14 }}>{qty}</span>
        <button onClick={() => onQty(qty + 1)} style={{ width: 22, height: 22, borderRadius: "50%", border: `1px solid ${T.grayLight}`, background: T.white, cursor: "pointer", color: T.gray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>+</button>
      </div>
      <button onClick={onRemove} style={{ marginLeft: 4, background: "none", border: "none", cursor: "pointer", color: T.grayLight, fontSize: 16, padding: "0 3px" }}>×</button>
    </div>
  );
}

function ProductSelector({ produtos, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");

  const available = CATALOG.filter(p => p.toLowerCase().includes(search.toLowerCase()) && !produtos.find(x => x.nome === p));
  const add = (nome) => { onChange([...produtos, { nome, qty: 1 }]); setSearch(""); setOpen(false); };
  const addCustom = () => { const name = customName.trim(); if (!name || produtos.find(x => x.nome === name)) return; onChange([...produtos, { nome: name, qty: 1 }]); setCustomName(""); setOpen(false); };
  const updateQty = (idx, qty) => { const next = [...produtos]; next[idx] = { ...next[idx], qty }; onChange(next); };
  const remove = (idx) => onChange(produtos.filter((_, i) => i !== idx));

  const inputStyle = { width: "100%", padding: "9px 13px", borderRadius: 9, border: `1.5px solid ${T.grayLight}`, background: T.white, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.text, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ gridColumn: "1/-1" }}>
      <div style={{ ...css.label, marginBottom: 10 }}>Produtos Vendidos</div>
      {produtos.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {produtos.map((p, i) => <ProductPill key={p.nome} nome={p.nome} qty={p.qty} onQty={q => updateQty(i, q)} onRemove={() => remove(i)} />)}
        </div>
      )}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button onClick={() => { setOpen(!open); setSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, cursor: "pointer", border: `1.5px dashed ${open ? T.green : T.green + "60"}`, background: open ? `${T.green}10` : `${T.green}05`, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.green, fontWeight: 600 }}>
          <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span> Adicionar produto
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 300, background: T.white, borderRadius: 14, boxShadow: "0 8px 40px rgba(45,80,22,0.18)", border: `1px solid ${T.grayLight}`, minWidth: 300, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.beigeDeep}` }}>
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto do catálogo..." style={inputStyle} />
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {available.length > 0 ? available.map(p => (
                <div key={p} onClick={() => add(p)} style={{ padding: "11px 16px", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: T.text }} onMouseEnter={e => e.currentTarget.style.background = T.beige} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ color: T.gold, fontSize: 9 }}>✦</span> {p}
                </div>
              )) : <div style={{ padding: "12px 16px", fontSize: 13, color: T.gray, fontFamily: "'DM Sans', sans-serif" }}>{search ? "Nenhum produto encontrado" : "Todos os produtos já adicionados"}</div>}
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.beigeDeep}`, display: "flex", gap: 8 }}>
              <input value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} placeholder="Ou digite um produto personalizado..." style={{ ...inputStyle, flex: 1, fontSize: 12 }} />
              <button onClick={addCustom} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: T.green, color: T.white, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600 }}>Adicionar</button>
            </div>
          </div>
        )}
      </div>
      {produtos.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: T.gray, fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ color: T.green, fontWeight: 600 }}>{produtos.reduce((s, p) => s + p.qty, 0)}</span> unidades · <span style={{ color: T.green, fontWeight: 600 }}>{produtos.length}</span> produto{produtos.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

function ProductBreakdownCard({ data }) {
  const byProduct = useMemo(() => {
    const m = {};
    data.forEach(d => { (d.produtos || []).forEach(({ nome, qty }) => { if (!m[nome]) m[nome] = { nome, qty: 0 }; m[nome].qty += qty; }); });
    return Object.values(m).sort((a, b) => b.qty - a.qty);
  }, [data]);
  const total = byProduct.reduce((s, p) => s + p.qty, 0);
  if (!byProduct.length) return null;
  return (
    <div style={css.card}>
      <SectionTitle>Produtos Vendidos</SectionTitle>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={byProduct} dataKey="qty" nameKey="nome" cx="50%" cy="50%" outerRadius={82} innerRadius={44}>
                {byProduct.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} un`, n]} contentStyle={{ borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220, alignSelf: "center" }}>
          {byProduct.map((p, i) => (
            <div key={p.nome} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: PALETTE[i % PALETTE.length] }} />
                  <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: T.text, fontWeight: 500 }}>{p.nome}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: T.gray }}>{((p.qty / total) * 100).toFixed(0)}%</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: PALETTE[i % PALETTE.length], fontFamily: "'Cormorant Garamond', serif" }}>{p.qty}</span>
                  <span style={{ fontSize: 11, color: T.gray }}>un</span>
                </div>
              </div>
              <div style={{ height: 7, background: T.beigeDeep, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(p.qty / byProduct[0].qty) * 100}%`, height: "100%", background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.beigeDeep}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: T.gray, fontFamily: "'DM Sans', sans-serif" }}>Total de unidades</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.green, fontFamily: "'Cormorant Garamond', serif" }}>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
const BLANK = {
  date: new Date().toISOString().slice(0, 10),
  seller: "", origin: "Direct", type: "Ativa",
  abordado: "", respondeu: "", qualificado: "", ofertas: "", vendas: "", valor: "",
  produtos: [], pagamento: "À vista", entrada: "", followup: "",
  motivo: "sem dinheiro", nivel: "Quente", obs: "", insight: "",
};

function FormPage({ onAdd }) {
  const [f, setF] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const fieldStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.grayLight}`, background: T.white, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.text, outline: "none", boxSizing: "border-box" };

  const handleSubmit = async () => {
    if (!f.seller || !f.date) return alert("Preencha ao menos Data e Social Seller.");
    setSaving(true);
    const num = v => parseFloat(v) || 0;
    const record = {
      ...f, abordado: num(f.abordado), respondeu: num(f.respondeu),
      qualificado: num(f.qualificado), ofertas: num(f.ofertas),
      vendas: num(f.vendas), valor: num(f.valor),
      entrada: num(f.entrada), followup: num(f.followup),
    };
    const { data, error } = await supabase.from("registros").insert([record]).select();
    setSaving(false);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    onAdd(data[0]);
    setF(BLANK);
    alert("Registro salvo com sucesso! ✦");
  };

  const Section = ({ title, children }) => (
    <div style={{ ...css.card, marginBottom: 20 }}>
      <div style={{ ...css.label, marginBottom: 18, color: T.green }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>{children}</div>
    </div>
  );

  const F = ({ k, label, type = "text", opts, placeholder, full }) => (
    <div style={full ? { gridColumn: "1/-1" } : {}}>
      <div style={{ ...css.label, marginBottom: 6 }}>{label}</div>
      {type === "select" ? (
        <select value={f[k]} onChange={set(k)} style={{ ...fieldStyle, cursor: "pointer" }}>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={f[k]} onChange={set(k)} placeholder={placeholder} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
      ) : (
        <input type={type} value={f[k]} onChange={set(k)} placeholder={placeholder} style={fieldStyle} />
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ ...css.h1, fontSize: 32, margin: 0 }}>Registro Diário</h1>
        <p style={{ ...css.body, color: T.gray, marginTop: 6 }}>Preencha as atividades do dia em menos de 2 minutos</p>
      </div>
      <Section title="Identificação">
        <F k="date" label="Data" type="date" />
        <F k="seller" label="Social Seller" placeholder="Nome completo" />
        <F k="origin" label="Origem do Lead" type="select" opts={["Direct","Novo Seguidor","ManyChat"]} />
        <F k="type" label="Tipo de abordagem" type="select" opts={["Ativa","Receptiva"]} />
      </Section>
      <Section title="Volume de Atividade">
        <F k="abordado" label="Qtd. Abordada" type="number" />
        <F k="respondeu" label="Qtd. Respondeu" type="number" />

        <F k="ofertas" label="Ofertas Enviadas" type="number" />
      </Section>
      <Section title="Resultado">
        <F k="vendas" label="Vendas Realizadas" type="number" />
        <F k="valor" label="Valor Total Vendido (R$)" type="number" />
        <ProductSelector produtos={f.produtos} onChange={p => setF({ ...f, produtos: p })} />
        <F k="pagamento" label="Forma de Pagamento" type="select" opts={["À vista","Parcelado","Recorrente","Boleto"]} />
        <F k="entrada" label="Entrada (R$)" type="number" placeholder="Opcional" />
      </Section>
      <Section title="Follow-up & Qualificação">
        <F k="followup" label="Leads em Follow-up" type="number" />
        <F k="motivo" label="Motivo de Não Fechamento" type="select" opts={["sem dinheiro","sem limite","sem tempo","não respondeu","só curioso","outro"]} />
        <F k="nivel" label="Nível do Lead" type="select" opts={["Frio","Morno","Quente"]} />
      </Section>
      <Section title="Observações">
        <F k="obs" label="Observações" type="textarea" placeholder="Comentários adicionais..." full />
        <F k="insight" label="Insight do Dia" placeholder="Ex: Direct está convertendo melhor hoje" />
      </Section>
      <button onClick={handleSubmit} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`, color: T.white, border: "none", borderRadius: 12, padding: "14px 40px", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, marginBottom: 40 }}>
        {saving ? "Salvando..." : "Salvar Registro ✦"}
      </button>
    </div>
  );
}

// ─── LIST PAGE ────────────────────────────────────────────────────────────────
function ListPage({ data, onDelete, onEdit }) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = data.filter(d =>
    d.seller?.toLowerCase().includes(search.toLowerCase()) ||
    d.origin?.toLowerCase().includes(search.toLowerCase()) ||
    d.date?.includes(search)
  );

  const startEdit = r => { setEditId(r.id); setEditData({ ...r }); };
  const cancelEdit = () => { setEditId(null); setEditData(null); };

  const saveEdit = async () => {
    setSaving(true);
    const { error } = await supabase.from("registros").update(editData).eq("id", editData.id);
    setSaving(false);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    onEdit(editData);
    setEditId(null);
    setEditData(null);
  };

  const handleDelete = async id => {
    const { error } = await supabase.from("registros").delete().eq("id", id);
    if (error) { alert("Erro ao apagar: " + error.message); return; }
    onDelete(id);
    setConfirmId(null);
  };

  const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 8, border: `1.5px solid ${T.grayLight}`, background: T.white, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.text, outline: "none", boxSizing: "border-box" };
  const nivelColor = { Quente: "#DC2626", Morno: "#D97706", Frio: "#2563EB" };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...css.h1, fontSize: 32, margin: 0 }}>Registros</h1>
        <p style={{ ...css.body, color: T.gray, marginTop: 6 }}>Visualize, edite ou apague registros individualmente</p>
      </div>
      <div style={{ ...css.card, marginBottom: 20, padding: "14px 18px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por vendedora, origem ou data..." style={{ ...inputStyle, fontSize: 14 }} />
      </div>
      <div style={{ marginBottom: 14, fontSize: 13, color: T.gray, fontFamily: "'DM Sans', sans-serif" }}>
        Exibindo <strong style={{ color: T.green }}>{filtered.length}</strong> de {data.length} registros
      </div>
      {filtered.length === 0 && <div style={{ ...css.card, textAlign: "center", padding: "48px 20px", color: T.gray, fontFamily: "'DM Sans', sans-serif" }}>Nenhum registro encontrado.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map(r => {
          const isEditing = editId === r.id;
          const ed = editData;
          return (
            <div key={r.id} style={{ ...css.card, borderLeft: `4px solid ${isEditing ? T.gold : T.green}` }}>
              {isEditing ? (
                <div>
                  <div style={{ ...css.label, color: T.gold, marginBottom: 16 }}>Editando registro</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 16 }}>
                    {[
                      { k:"date", label:"Data", type:"date" },
                      { k:"seller", label:"Vendedora" },

                      { k:"abordado", label:"Abordados", type:"number" },
                      { k:"respondeu", label:"Responderam", type:"number" },

                      { k:"ofertas", label:"Ofertas", type:"number" },
                      { k:"vendas", label:"Vendas", type:"number" },
                      { k:"valor", label:"Valor (R$)", type:"number" },
                      { k:"pagamento", label:"Pagamento", type:"select", opts:["À vista","Parcelado","Recorrente","Boleto"] },
                      { k:"nivel", label:"Nível", type:"select", opts:["Frio","Morno","Quente"] },
                      { k:"motivo", label:"Motivo perda", type:"select", opts:["sem dinheiro","sem limite","sem tempo","não respondeu","só curioso","outro"] },
                    ].map(({ k, label, type = "text", opts }) => (
                      <div key={k}>
                        <div style={{ ...css.label, marginBottom: 5, fontSize: 10 }}>{label}</div>
                        {type === "select" ? (
                          <select value={ed[k]} onChange={e => setEditData({ ...ed, [k]: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }}>
                            {opts.map(o => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={type} value={ed[k]} onChange={e => setEditData({ ...ed, [k]: e.target.value })} style={inputStyle} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <ProductSelector produtos={ed.produtos || []} onChange={p => setEditData({ ...ed, produtos: p })} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ ...css.label, marginBottom: 5, fontSize: 10 }}>Observações</div>
                    <textarea value={ed.obs} onChange={e => setEditData({ ...ed, obs: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={saveEdit} disabled={saving} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: T.green, color: T.white, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button onClick={cancelEdit} style={{ padding: "9px 20px", borderRadius: 9, border: `1.5px solid ${T.grayLight}`, background: T.white, color: T.gray, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                      {[{ l:"Data", v:r.date }, { l:"Vendedora", v:r.seller, green:true }].map(({ l, v, green }) => (
                        <div key={l}>
                          <div style={{ ...css.label, fontSize: 10 }}>{l}</div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: green ? T.green : T.text, fontSize: 14 }}>{v}</div>
                        </div>
                      ))}
                      <div>
                        <div style={{ ...css.label, fontSize: 10 }}>Origem</div>
                        <div style={{ background: `${T.green}12`, color: T.green, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{r.origin}</div>
                      </div>
                      <div>
                        <div style={{ ...css.label, fontSize: 10 }}>Tipo</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.gray }}>{r.type}</div>
                      </div>
                      <div>
                        <div style={{ ...css.label, fontSize: 10 }}>Nível</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: nivelColor[r.nivel] || T.gray }}>{r.nivel}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ ...css.label, fontSize: 10 }}>Faturamento</div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: T.gold }}>{fmt(r.valor)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(r)} style={{ width: 36, height: 36, borderRadius: 9, border: `1.5px solid ${T.grayLight}`, background: T.white, cursor: "pointer", color: T.green, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✎</button>
                        <button onClick={() => setConfirmId(r.id)} style={{ width: 36, height: 36, borderRadius: 9, border: "1.5px solid #FCA5A5", background: "#FEF2F2", cursor: "pointer", color: "#DC2626", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${T.beigeDeep}` }}>
                    {[["Abordados",r.abordado],["Responderam",r.respondeu],["Qualificados",r.qualificado],["Ofertas",r.ofertas],["Vendas",r.vendas],["Follow-up",r.followup]].map(([l,v]) => (
                      <div key={l}>
                        <div style={{ ...css.label, fontSize: 9 }}>{l}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: T.text, fontSize: 16 }}>{v}</div>
                      </div>
                    ))}
                    <div>
                      <div style={{ ...css.label, fontSize: 9 }}>Pagamento</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.gray }}>{r.pagamento}</div>
                    </div>
                  </div>
                  {(r.produtos || []).length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {r.produtos.map(p => (
                        <span key={p.nome} style={{ background: `${T.gold}15`, color: T.gold, border: `1px solid ${T.gold}40`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{p.nome} × {p.qty}</span>
                      ))}
                    </div>
                  )}
                  {r.obs && <div style={{ marginTop: 10, fontSize: 12, color: T.gray, fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>"{r.obs}"</div>}
                  {confirmId === r.id && (
                    <div style={{ marginTop: 14, padding: "12px 16px", background: "#FEF2F2", borderRadius: 10, border: "1px solid #FCA5A5", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#DC2626", fontWeight: 500 }}>Apagar este registro permanentemente?</span>
                      <button onClick={() => handleDelete(r.id)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "#DC2626", color: T.white, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13 }}>Sim, apagar</button>
                      <button onClick={() => setConfirmId(null)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #FCA5A5", background: T.white, color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Cancelar</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ data }) {
  const total = useMemo(() => ({
    valor: data.reduce((s, d) => s + d.valor, 0),
    vendas: data.reduce((s, d) => s + d.vendas, 0),
    abordado: data.reduce((s, d) => s + d.abordado, 0),
    respondeu: data.reduce((s, d) => s + d.respondeu, 0),
    qualificado: data.reduce((s, d) => s + d.qualificado, 0),
    ofertas: data.reduce((s, d) => s + d.ofertas, 0),
    followup: data.reduce((s, d) => s + d.followup, 0),
  }), [data]);

  const ticket = total.vendas ? total.valor / total.vendas : 0;

  const byDay = useMemo(() => {
    const m = {};
    data.forEach(d => { m[d.date] = (m[d.date] || 0) + d.valor; });
    return Object.entries(m).sort().map(([date, valor]) => ({ date: date.slice(5), valor }));
  }, [data]);

  const byOrigin = useMemo(() => {
    const m = {};
    data.forEach(d => {
      if (!m[d.origin]) m[d.origin] = { origin: d.origin, vendas: 0, abordado: 0, ofertas: 0 };
      m[d.origin].vendas += d.vendas; m[d.origin].abordado += d.abordado; m[d.origin].ofertas += d.ofertas;
    });
    return Object.values(m);
  }, [data]);

  const bySeller = useMemo(() => {
    const m = {};
    data.forEach(d => {
      if (!m[d.seller]) m[d.seller] = { seller: d.seller?.split(" ")[0], valor: 0, vendas: 0 };
      m[d.seller].valor += d.valor; m[d.seller].vendas += d.vendas;
    });
    return Object.values(m);
  }, [data]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...css.h1, fontSize: 32, margin: 0 }}>Dashboard Operacional</h1>
        <p style={{ ...css.body, color: T.gray, marginTop: 6 }}>Visão geral em tempo real das atividades</p>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <KpiCard label="Faturamento Total" value={fmt(total.valor)} gold />
        <KpiCard label="Total de Vendas" value={total.vendas} />
        <KpiCard label="Ticket Médio" value={fmt(ticket)} />
        <KpiCard label="Total Abordado" value={total.abordado.toLocaleString()} />
        <KpiCard label="Taxa de Resposta" value={pct(total.respondeu, total.abordado)} />
        <KpiCard label="Taxa de Conversão" value={pct(total.vendas, total.ofertas)} />
        <KpiCard label="Em Follow-up" value={total.followup} sub="leads ativos" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={css.card}>
          <SectionTitle>Faturamento por Dia</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.grayLight} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: T.gray }} />
              <YAxis tick={{ fontSize: 11, fill: T.gray }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10 }} />
              <Line type="monotone" dataKey="valor" stroke={T.green} strokeWidth={2.5} dot={{ fill: T.gold, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={css.card}>
          <SectionTitle>Vendas por Origem</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byOrigin}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.grayLight} />
              <XAxis dataKey="origin" tick={{ fontSize: 11, fill: T.gray }} />
              <YAxis tick={{ fontSize: 11, fill: T.gray }} />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
              <Bar dataKey="vendas" fill={T.green} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}><ProductBreakdownCard data={data} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={css.card}>
          <SectionTitle>Funil de Vendas</SectionTitle>
          {[
            { label:"Abordados", val:total.abordado, p:100 },
            { label:"Responderam", val:total.respondeu, p:(total.respondeu/total.abordado*100)||0 },
            { label:"Qualificados", val:total.qualificado, p:(total.qualificado/total.abordado*100)||0 },
            { label:"Ofertas", val:total.ofertas, p:(total.ofertas/total.abordado*100)||0 },
            { label:"Vendas", val:total.vendas, p:(total.vendas/total.abordado*100)||0 },
          ].map(({ label, val, p }, i) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>{val.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, background: T.beigeDeep, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${p}%`, height: "100%", background: i === 4 ? T.gold : T.green, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={css.card}>
          <SectionTitle>Performance por Vendedora</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySeller} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.grayLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.gray }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="seller" tick={{ fontSize: 12, fill: T.text }} width={70} />
              <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10 }} />
              <Bar dataKey="valor" fill={T.greenLight} radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS ─────────────────────────────────────────────────────────────────
function ResultsPage({ data }) {
  const byOriginRevenue = useMemo(() => {
    const m = {};
    data.forEach(d => { m[d.origin] = (m[d.origin] || 0) + d.valor; });
    const total = Object.values(m).reduce((a, b) => a + b, 0);
    return Object.entries(m).map(([name, value]) => ({ name, value, pct: ((value/total)*100).toFixed(1) }));
  }, [data]);

  const byMotivo = useMemo(() => {
    const m = {};
    data.forEach(d => { if (d.motivo) m[d.motivo] = (m[d.motivo] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).map(([name, value]) => ({ name, value }));
  }, [data]);

  const COLORS = [T.green, T.gold, T.greenLight, T.goldLight, "#A0845C", "#8B6914"];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...css.h1, fontSize: 32, margin: 0 }}>Resultados Estratégicos</h1>
        <p style={{ ...css.body, color: T.gray, marginTop: 6 }}>Análise aprofundada para decisões de negócio</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div style={css.card}>
          <SectionTitle>Origem do Faturamento</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byOriginRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label={({ name, pct }) => `${name} ${pct}%`} labelLine={false}>
                {byOriginRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={css.card}>
          <SectionTitle>Gargalos — Motivos de Perda</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMotivo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.grayLight} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: T.gray }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: T.text }} width={90} />
              <Tooltip contentStyle={{ borderRadius: 10 }} />
              <Bar dataKey="value" fill={T.gold} radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}><ProductBreakdownCard data={data} /></div>
      <div style={css.card}>
        <SectionTitle>Comparativo por Canal</SectionTitle>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {byOriginRevenue.map((o, i) => (
            <div key={o.name} style={{ flex: 1, minWidth: 140, background: `linear-gradient(135deg, ${COLORS[i]}15, ${COLORS[i]}05)`, border: `1px solid ${COLORS[i]}30`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ ...css.label, color: COLORS[i], marginBottom: 8 }}>{o.name}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: COLORS[i] }}>{fmt(o.value)}</div>
              <div style={{ fontSize: 12, color: T.gray, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{o.pct}% do faturamento</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRESENTATION ─────────────────────────────────────────────────────────────
function PresentationPage({ data }) {
  const total = useMemo(() => ({
    valor: data.reduce((s, d) => s + d.valor, 0),
    vendas: data.reduce((s, d) => s + d.vendas, 0),
    abordado: data.reduce((s, d) => s + d.abordado, 0),
    respondeu: data.reduce((s, d) => s + d.respondeu, 0),
    ofertas: data.reduce((s, d) => s + d.ofertas, 0),
    followup: data.reduce((s, d) => s + d.followup, 0),
  }), [data]);

  const ticket = total.vendas ? total.valor / total.vendas : 0;

  const byOrigin = useMemo(() => {
    const m = {};
    data.forEach(d => {
      if (!m[d.origin]) m[d.origin] = { origin: d.origin, valor: 0, vendas: 0, ofertas: 0 };
      m[d.origin].valor += d.valor; m[d.origin].vendas += d.vendas; m[d.origin].ofertas += d.ofertas;
    });
    return Object.values(m);
  }, [data]);

  const byMotivo = useMemo(() => {
    const m = {};
    data.forEach(d => { if (d.motivo) m[d.motivo] = (m[d.motivo] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }, [data]);

  const byProduct = useMemo(() => {
    const m = {};
    data.forEach(d => { (d.produtos || []).forEach(({ nome, qty }) => { if (!m[nome]) m[nome] = { nome, qty: 0 }; m[nome].qty += qty; }); });
    return Object.values(m).sort((a, b) => b.qty - a.qty);
  }, [data]);

  const bestChannel = [...byOrigin].sort((a,b) => (b.vendas/Math.max(b.ofertas,1)) - (a.vendas/Math.max(a.ofertas,1)))[0];
  const topProduct = byProduct[0];
  const totalByOrigin = byOrigin.reduce((s, o) => s + o.valor, 0);
  const totalQty = byProduct.reduce((s, p) => s + p.qty, 0);

  const insights = [
    bestChannel && `O canal ${bestChannel.origin} apresenta a maior taxa de conversão no período.`,
    byMotivo[0] && `A principal perda de vendas está relacionada a "${byMotivo[0][0]}".`,
    total.followup > 0 && `Existem ${total.followup} leads em follow-up — oportunidade ativa de faturamento.`,
    topProduct && `O produto mais vendido é "${topProduct.nome}" com ${topProduct.qty} unidades no período.`,
  ].filter(Boolean);

  const Block = ({ num, title, children }) => (
    <div style={{ ...css.card, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.green}, ${T.greenLight})`, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>{num}</div>
        <h3 style={{ ...css.h2, fontSize: 18, margin: 0 }}>{title}</h3>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.gold}50, transparent)` }} />
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ ...css.label, color: T.gold, marginBottom: 8 }}>Relatório Social Selling</div>
        <h1 style={{ ...css.h1, fontSize: 38, margin: 0 }}>André Ferraz — Aromaterapia</h1>
        <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, ${T.green}, ${T.gold})`, margin: "16px auto 0" }} />
      </div>
      <Block num="01" title="Resultado Geral">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[{l:"Faturamento Gerado",v:fmt(total.valor),gold:true},{l:"Total de Vendas",v:total.vendas},{l:"Ticket Médio",v:fmt(ticket)}].map(({l,v,gold})=>(
            <div key={l} style={{ flex:1,minWidth:140,textAlign:"center",padding:"20px 16px",background:T.beige,borderRadius:12 }}>
              <div style={css.label}>{l}</div>
              <div style={{ fontSize:28,fontWeight:700,color:gold?T.gold:T.green,fontFamily:"'Cormorant Garamond', serif",marginTop:8 }}>{v}</div>
            </div>
          ))}
        </div>
      </Block>
      <Block num="02" title="De onde vem o dinheiro">
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {byOrigin.map(o=>(
            <div key={o.origin} style={{ display:"flex",alignItems:"center",gap:14 }}>
              <div style={{ width:110,fontSize:13,fontFamily:"'DM Sans', sans-serif",fontWeight:500 }}>{o.origin}</div>
              <div style={{ flex:1,height:10,background:T.beigeDeep,borderRadius:5,overflow:"hidden" }}>
                <div style={{ width:`${(o.valor/totalByOrigin*100)||0}%`,height:"100%",background:`linear-gradient(90deg, ${T.green}, ${T.greenLight})`,borderRadius:5 }} />
              </div>
              <div style={{ width:90,fontSize:13,fontWeight:700,color:T.green,textAlign:"right",fontFamily:"'DM Sans', sans-serif" }}>{fmt(o.valor)}</div>
              <div style={{ width:44,fontSize:12,color:T.gray,fontFamily:"'DM Sans', sans-serif" }}>{((o.valor/totalByOrigin*100)||0).toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </Block>
      <Block num="03" title="Produtos Vendidos no Período">
        {byProduct.length > 0 ? (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            {byProduct.map((p,i)=>(
              <div key={p.nome} style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:PALETTE[i%PALETTE.length],flexShrink:0 }} />
                <div style={{ flex:1,fontSize:13,fontFamily:"'DM Sans', sans-serif",fontWeight:500 }}>{p.nome}</div>
                <div style={{ flex:2,height:8,background:T.beigeDeep,borderRadius:4,overflow:"hidden" }}>
                  <div style={{ width:`${(p.qty/byProduct[0].qty)*100}%`,height:"100%",background:PALETTE[i%PALETTE.length],borderRadius:4 }} />
                </div>
                <div style={{ width:70,textAlign:"right",display:"flex",alignItems:"baseline",justifyContent:"flex-end",gap:4 }}>
                  <span style={{ fontSize:20,fontWeight:700,color:PALETTE[i%PALETTE.length],fontFamily:"'Cormorant Garamond', serif" }}>{p.qty}</span>
                  <span style={{ fontSize:11,color:T.gray }}>un</span>
                </div>
                <div style={{ width:40,fontSize:11,color:T.gray,textAlign:"right" }}>{((p.qty/totalQty)*100).toFixed(0)}%</div>
              </div>
            ))}
            <div style={{ marginTop:8,paddingTop:10,borderTop:`1px solid ${T.beigeDeep}`,display:"flex",justifyContent:"flex-end",gap:8,fontSize:12,color:T.gray,fontFamily:"'DM Sans', sans-serif",alignItems:"center" }}>
              Total: <strong style={{ color:T.green,fontSize:15,fontFamily:"'Cormorant Garamond', serif" }}>{totalQty} unidades</strong>
            </div>
          </div>
        ) : <p style={{ color:T.gray,fontFamily:"'DM Sans', sans-serif",fontSize:13 }}>Nenhum produto registrado.</p>}
      </Block>
      <Block num="04" title="Eficiência do Processo">
        <div style={{ display:"flex",alignItems:"center",flexWrap:"wrap" }}>
          {[{l:"Abordados",v:total.abordado},{l:"Responderam",v:total.respondeu},{l:"Vendas",v:total.vendas}].map(({l,v},i,arr)=>(
            <span key={l} style={{ display:"flex",alignItems:"center",gap:0 }}>
              <div style={{ textAlign:"center",padding:"16px 20px" }}>
                <div style={{ fontSize:32,fontWeight:700,color:T.green,fontFamily:"'Cormorant Garamond', serif" }}>{v.toLocaleString()}</div>
                <div style={{ ...css.label,marginTop:4 }}>{l}</div>
              </div>
              {i<arr.length-1&&<span style={{ color:T.gold,fontSize:20 }}>→</span>}
            </span>
          ))}
        </div>
      </Block>
      <Block num="05" title="Gargalos Identificados">
        <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
          {byMotivo.map(([name,count],i)=>(
            <div key={name} style={{ padding:"10px 18px",borderRadius:20,background:i===0?`${T.gold}20`:T.beige,border:`1px solid ${i===0?T.gold:T.grayLight}`,fontSize:13,fontFamily:"'DM Sans', sans-serif" }}>
              {i===0&&<span style={{ color:T.gold,marginRight:6 }}>▲</span>}{name} <strong style={{ color:T.green }}>({count}x)</strong>
            </div>
          ))}
        </div>
      </Block>
      <Block num="06" title="Oportunidades">
        {bestChannel&&(
          <div style={{ background:`linear-gradient(135deg, ${T.green}08, ${T.gold}08)`,border:`1px solid ${T.gold}30`,borderRadius:12,padding:"16px 20px",fontFamily:"'DM Sans', sans-serif",fontSize:14 }}>
            <strong style={{ color:T.green }}>Canal com maior conversão: {bestChannel.origin}</strong><br />
            Taxa de conversão: {pct(bestChannel.vendas,bestChannel.ofertas)} — Considere ampliar investimento neste canal.
          </div>
        )}
      </Block>
      <Block num="07" title="Follow-up — Oportunidades em Aberto">
        <div style={{ display:"flex",alignItems:"center",gap:24,padding:"8px 0" }}>
          <div style={{ fontSize:52,fontWeight:700,color:T.gold,fontFamily:"'Cormorant Garamond', serif" }}>{total.followup}</div>
          <div style={{ fontFamily:"'DM Sans', sans-serif",fontSize:14,color:T.gray,lineHeight:1.6 }}>leads aguardando contato<br /><strong style={{ color:T.text }}>Potencial de faturamento não realizado.</strong></div>
        </div>
      </Block>
      <div style={{ ...css.card,background:`linear-gradient(135deg, ${T.green}, ${T.greenMid})`,border:"none" }}>
        <div style={{ ...css.label,color:T.gold,marginBottom:16 }}>Insights Automáticos</div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {insights.map((txt,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.08)",borderRadius:10,padding:"12px 16px",fontFamily:"'DM Sans', sans-serif",fontSize:13,color:T.white,lineHeight:1.5,borderLeft:`3px solid ${T.gold}` }}>
              <span style={{ color:T.gold,marginRight:8 }}>✦</span>{txt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
function FilterBar({ data, filters, setFilters }) {
  const sellers = [...new Set(data.map(d => d.seller))];
  const origins = [...new Set(data.map(d => d.origin))];
  const produtos = [...new Set(data.flatMap(d => (d.produtos || []).map(p => p.nome)).filter(Boolean))];
  const sel = { padding:"8px 14px",borderRadius:8,border:`1.5px solid ${T.grayLight}`,background:T.white,fontFamily:"'DM Sans', sans-serif",fontSize:13,color:T.text,cursor:"pointer",outline:"none" };
  return (
    <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:28,padding:"16px 20px",background:T.white,borderRadius:14,border:`1px solid ${T.grayLight}` }}>
      <div style={{ ...css.label,alignSelf:"center",minWidth:60 }}>Filtros</div>
      <select style={sel} value={filters.seller} onChange={e=>setFilters({...filters,seller:e.target.value})}>
        <option value="">Todas Vendedoras</option>
        {sellers.map(s=><option key={s}>{s}</option>)}
      </select>
      <select style={sel} value={filters.origin} onChange={e=>setFilters({...filters,origin:e.target.value})}>
        <option value="">Todas Origens</option>
        {origins.map(o=><option key={o}>{o}</option>)}
      </select>
      <select style={sel} value={filters.produto} onChange={e=>setFilters({...filters,produto:e.target.value})}>
        <option value="">Todos Produtos</option>
        {produtos.map(p=><option key={p}>{p}</option>)}
      </select>
      <input type="date" style={sel} value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})} />
      <input type="date" style={sel} value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})} />
      {(filters.seller||filters.origin||filters.produto||filters.from||filters.to)&&(
        <button onClick={()=>setFilters({seller:"",origin:"",produto:"",from:"",to:""})} style={{ ...sel,background:T.beige,color:T.gray }}>✕ Limpar</button>
      )}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"form",    label:"Registro",     icon:"✦" },
  { id:"list",    label:"Registros",    icon:"☰" },
  { id:"dash",    label:"Dashboard",    icon:"◈" },
  { id:"results", label:"Resultados",   icon:"◉" },
  { id:"pres",    label:"Apresentação", icon:"◇" },
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dash");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ seller:"", origin:"", produto:"", from:"", to:"" });

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("registros").select("*").order("date", { ascending: false });
      if (!error) setRecords(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => records.filter(d => {
    if (filters.seller && d.seller !== filters.seller) return false;
    if (filters.origin && d.origin !== filters.origin) return false;
    if (filters.produto && !(d.produtos||[]).find(p => p.nome === filters.produto)) return false;
    if (filters.from && d.date < filters.from) return false;
    if (filters.to && d.date > filters.to) return false;
    return true;
  }), [records, filters]);

  const handleAdd    = r => setRecords(prev => [r, ...prev]);
  const handleDelete = id => setRecords(prev => prev.filter(r => r.id !== id));
  const handleEdit   = updated => setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));

  return (
    <div style={{ minHeight:"100vh", background:T.beige }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${T.beige}; }
        ::-webkit-scrollbar-thumb { background: ${T.grayLight}; border-radius: 3px; }
        select:focus, input:focus, textarea:focus { border-color: ${T.green} !important; outline: none; }
      `}</style>
      <div style={{ position:"fixed",top:0,left:0,bottom:0,width:220,background:T.green,display:"flex",flexDirection:"column",zIndex:100 }}>
        <div style={{ padding:"32px 24px 24px",borderBottom:`1px solid rgba(255,255,255,0.1)` }}>
          <div style={{ fontSize:10,letterSpacing:"0.2em",color:T.gold,fontWeight:600,marginBottom:4 }}>SOCIAL SELLING</div>
          <div style={{ fontFamily:"'Cormorant Garamond', serif",fontSize:20,color:T.white,fontWeight:600,lineHeight:1.3 }}>André Ferraz<br />Aromaterapia</div>
          <div style={{ width:30,height:1.5,background:T.gold,marginTop:12 }} />
        </div>
        <nav style={{ padding:"16px 12px",flex:1 }}>
          {TABS.map(({id,label,icon}) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{ width:"100%",padding:"12px 16px",borderRadius:10,background:active?"rgba(255,255,255,0.12)":"transparent",border:active?"1px solid rgba(255,255,255,0.15)":"1px solid transparent",color:active?T.white:"rgba(255,255,255,0.55)",display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:4,fontFamily:"'DM Sans', sans-serif",fontSize:14,fontWeight:active?600:400,textAlign:"left" }}>
                <span style={{ color:active?T.gold:"rgba(255,255,255,0.35)",fontSize:12 }}>{icon}</span>{label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"20px 24px",borderTop:`1px solid rgba(255,255,255,0.1)` }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:"'DM Sans', sans-serif" }}>{records.length} registros</div>
        </div>
      </div>
      <div style={{ marginLeft:220,padding:"40px 40px 60px",minHeight:"100vh" }}>
        {loading ? (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",fontFamily:"'DM Sans', sans-serif",color:T.gray,fontSize:15 }}>
            Carregando registros...
          </div>
        ) : (
          <>
            {tab!=="form"&&tab!=="pres"&&tab!=="list"&&<FilterBar data={records} filters={filters} setFilters={setFilters} />}
            {tab==="form"    && <FormPage onAdd={handleAdd} />}
            {tab==="list"    && <ListPage data={records} onDelete={handleDelete} onEdit={handleEdit} />}
            {tab==="dash"    && <DashboardPage data={filtered} />}
            {tab==="results" && <ResultsPage data={filtered} />}
            {tab==="pres"    && <PresentationPage data={filtered} />}
          </>
        )}
      </div>
    </div>
  );
}
