import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  listarConsultoresAdmin,
  credenciarConsultorAdmin,
  atualizarConsultorAdmin,
  listarContratosAdmin,
  criarContratoAdmin,
  atualizarContratoAdmin,
  listarUsuariosAdmin,
  listarEmpresasAdmin,
} from "@/lib/admin.functions";
import { AdminErrorState } from "@/components/AdminErrorState";

export const Route = createFileRoute("/admin/consultores")({ component: Page });

function Page() {
  const qc = useQueryClient();

  const consultoresFn = useServerFn(listarConsultoresAdmin);
  const credenciarFn = useServerFn(credenciarConsultorAdmin);
  const atualizarConsultorFn = useServerFn(atualizarConsultorAdmin);
  const contratosFn = useServerFn(listarContratosAdmin);
  const criarContratoFn = useServerFn(criarContratoAdmin);
  const atualizarContratoFn = useServerFn(atualizarContratoAdmin);
  const usuariosFn = useServerFn(listarUsuariosAdmin);
  const empresasFn = useServerFn(listarEmpresasAdmin);

  const consultoresQ = useQuery({
    queryKey: ["admin", "consultores"],
    queryFn: () => consultoresFn(),
  });
  const contratosQ = useQuery({ queryKey: ["admin", "contratos"], queryFn: () => contratosFn() });
  const usuariosQ = useQuery({ queryKey: ["admin", "usuarios"], queryFn: () => usuariosFn() });
  const empresasQ = useQuery({ queryKey: ["admin", "empresas"], queryFn: () => empresasFn() });

  const [buscaUsuario, setBuscaUsuario] = useState("");
  const [form, setForm] = useState({
    userId: "",
    nome: "",
    email: "",
    telefone: "",
    especialidade: "",
  });

  const [contratoForm, setContratoForm] = useState({
    consultorId: "",
    empresaId: "",
    creditosContratados: 10,
  });

  const credenciarMut = useMutation({
    mutationFn: async () =>
      credenciarFn({
        data: {
          userId: form.userId,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || null,
          especialidade: form.especialidade || null,
        },
      }),
    onSuccess: () => {
      setForm({ userId: "", nome: "", email: "", telefone: "", especialidade: "" });
      qc.invalidateQueries({ queryKey: ["admin", "consultores"] });
    },
  });

  const toggleAtivoMut = useMutation({
    mutationFn: async (v: { id: string; ativo: boolean }) => atualizarConsultorFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "consultores"] }),
  });

  const criarContratoMut = useMutation({
    mutationFn: async () =>
      criarContratoFn({
        data: {
          consultorId: contratoForm.consultorId,
          empresaId: contratoForm.empresaId,
          contratoInicio: new Date().toISOString().slice(0, 10),
          creditosContratados: contratoForm.creditosContratados,
        },
      }),
    onSuccess: () => {
      setContratoForm({ consultorId: "", empresaId: "", creditosContratados: 10 });
      qc.invalidateQueries({ queryKey: ["admin", "contratos"] });
    },
  });

  const encerrarContratoMut = useMutation({
    mutationFn: async (id: string) => atualizarContratoFn({ data: { id, status: "encerrado" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "contratos"] }),
  });

  const usuariosFiltrados = useMemo(() => {
    const t = buscaUsuario.trim().toLowerCase();
    if (!t) return [];
    return (usuariosQ.data ?? []).filter((u) => u.email.toLowerCase().includes(t)).slice(0, 8);
  }, [usuariosQ.data, buscaUsuario]);

  const consultores = consultoresQ.data ?? [];
  const empresas = empresasQ.data ?? [];
  const contratos = contratosQ.data ?? [];

  if (consultoresQ.isError) return <AdminErrorState error={consultoresQ.error as Error} />;

  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Time interno</div>
      <h1 className="text-3xl font-medium tracking-tight">Consultores</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Credencie consultores (vinculando uma conta já existente) e gerencie os contratos com
        empresas clientes — créditos, vigência e status.
      </p>

      <section className="mt-8 hairline p-5">
        <div className="eyebrow mb-3">Credenciar consultor</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <input
              value={buscaUsuario}
              onChange={(e) => {
                setBuscaUsuario(e.target.value);
                setForm((f) => ({ ...f, userId: "" }));
              }}
              placeholder="Buscar usuário por e-mail…"
              className="h-9 w-full rounded-sm hairline bg-background px-3 text-sm"
            />
            {usuariosFiltrados.length > 0 && !form.userId && (
              <div className="absolute z-10 mt-1 w-full hairline bg-background shadow-lg">
                {usuariosFiltrados.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setForm((f) => ({ ...f, userId: u.id, email: u.email }));
                      setBuscaUsuario(u.email);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs font-mono hover:bg-secondary"
                  >
                    {u.email}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            placeholder="Nome completo"
            className="h-9 rounded-sm hairline bg-background px-3 text-sm"
          />
          <input
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
            placeholder="Telefone (opcional)"
            className="h-9 rounded-sm hairline bg-background px-3 text-sm"
          />
          <input
            value={form.especialidade}
            onChange={(e) => setForm((f) => ({ ...f, especialidade: e.target.value }))}
            placeholder="Especialidade (opcional)"
            className="h-9 rounded-sm hairline bg-background px-3 text-sm"
          />
        </div>
        <button
          onClick={() => credenciarMut.mutate()}
          disabled={!form.userId || !form.nome || !form.email || credenciarMut.isPending}
          className="mt-4 inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          {credenciarMut.isPending ? "Credenciando…" : "Credenciar como consultor"}
        </button>
        {credenciarMut.error && (
          <div className="mt-2 text-[11px] text-destructive">
            {(credenciarMut.error as Error).message}
          </div>
        )}
      </section>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-3">Nome</div>
          <div className="col-span-3">E-mail</div>
          <div className="col-span-3">Especialidade</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Ação</div>
        </div>
        {consultoresQ.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : consultores.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Nenhum consultor credenciado.</div>
        ) : (
          consultores.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm last:border-0"
            >
              <div className="col-span-3 font-medium">{c.nome}</div>
              <div className="col-span-3 font-mono text-xs text-muted-foreground">{c.email}</div>
              <div className="col-span-3 text-xs text-muted-foreground">
                {c.especialidade ?? "—"}
              </div>
              <div className="col-span-2">
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                    c.ativo ? "bg-foreground text-background" : "hairline text-muted-foreground"
                  }`}
                >
                  {c.ativo ? "ativo" : "inativo"}
                </span>
              </div>
              <div className="col-span-1 text-right">
                <button
                  onClick={() => toggleAtivoMut.mutate({ id: c.id, ativo: !c.ativo })}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {c.ativo ? "desativar" : "ativar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-medium">Novo contrato</h2>
      <section className="hairline p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={contratoForm.consultorId}
            onChange={(e) => setContratoForm((f) => ({ ...f, consultorId: e.target.value }))}
            className="h-9 rounded-sm hairline bg-background px-2 text-sm"
          >
            <option value="">Consultor…</option>
            {consultores
              .filter((c) => c.ativo)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </select>
          <select
            value={contratoForm.empresaId}
            onChange={(e) => setContratoForm((f) => ({ ...f, empresaId: e.target.value }))}
            className="h-9 rounded-sm hairline bg-background px-2 text-sm"
          >
            <option value="">Empresa cliente…</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome_empresa}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={contratoForm.creditosContratados}
            onChange={(e) =>
              setContratoForm((f) => ({ ...f, creditosContratados: Number(e.target.value) }))
            }
            placeholder="Créditos contratados"
            className="h-9 rounded-sm hairline bg-background px-3 text-sm"
          />
        </div>
        <button
          onClick={() => criarContratoMut.mutate()}
          disabled={
            !contratoForm.consultorId || !contratoForm.empresaId || criarContratoMut.isPending
          }
          className="mt-4 inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          {criarContratoMut.isPending ? "Criando…" : "Criar contrato"}
        </button>
        {criarContratoMut.error && (
          <div className="mt-2 text-[11px] text-destructive">
            {(criarContratoMut.error as Error).message}
          </div>
        )}
      </section>

      <div className="mt-6 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-3">Consultor</div>
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2 text-right">Créditos</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Ação</div>
        </div>
        {contratosQ.isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Carregando…</div>
        ) : contratos.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Nenhum contrato.</div>
        ) : (
          contratos.map((ct) => (
            <div
              key={ct.id}
              className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b text-sm last:border-0"
            >
              <div className="col-span-3 font-medium">
                {(ct.consultor as { nome: string } | null)?.nome ?? "—"}
              </div>
              <div className="col-span-3">
                {(ct.empresa as { nome_empresa: string } | null)?.nome_empresa ?? "—"}
              </div>
              <div className="col-span-2 text-right font-mono text-xs">
                {ct.creditos_utilizados}/{ct.creditos_contratados}
              </div>
              <div className="col-span-2">
                <span
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                    ct.status === "ativo" ? "bg-foreground text-background" : "hairline"
                  }`}
                >
                  {ct.status}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {ct.status === "ativo" && (
                  <button
                    onClick={() => encerrarContratoMut.mutate(ct.id)}
                    className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
                  >
                    encerrar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
