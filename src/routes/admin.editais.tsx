import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEditaisAdmin, toggleEditalOculto } from "@/lib/scrape.functions";

export const Route = createFileRoute("/admin/editais")({
  component: AdminEditais,
});

type Row = {
  id: string;
  titulo: string;
  slug: string;
  fonte: string;
  status: string;
  tipo_apoio: string | null;
  data_encerramento: string | null;
  confianca_extracao: number;
  ativo: boolean;
  oculto: boolean;
  precisa_revisao: boolean;
  coletado_em: string;
};

function AdminEditais() {
  const qc = useQueryClient();
  const fn = useServerFn(listEditaisAdmin);
  const toggle = useServerFn(toggleEditalOculto);
  const { data = [] as Row[], isLoading } = useQuery({
    queryKey: ["admin-editais"],
    queryFn: () => fn() as Promise<Row[]>,
  });
  const mut = useMutation({
    mutationFn: async (v: { id: string; oculto: boolean }) => toggle({ data: v }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-editais"] }),
  });

  return (
    <div className="px-8 py-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow mb-2">CRUD</div>
          <h1 className="text-3xl font-medium tracking-tight">Editais coletados</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoading ? "carregando…" : `${data.length} editais no banco`}
          </p>
        </div>
      </div>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-5">Título</div>
          <div className="col-span-1">Fonte</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Apoio</div>
          <div className="col-span-1 text-right">Prazo</div>
          <div className="col-span-1 text-right">Conf.</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {data.map((e) => (
          <div
            key={e.id}
            className={`grid grid-cols-12 items-center gap-4 px-5 py-3.5 hairline-b last:border-0 text-sm hover:bg-secondary ${
              e.precisa_revisao ? "bg-secondary/40" : ""
            }`}
          >
            <div className="col-span-5">
              <div className="font-medium leading-snug">{e.titulo}</div>
              <div className="font-mono text-[10px] text-muted-foreground">{e.slug}</div>
            </div>
            <div className="col-span-1 font-mono text-xs">{e.fonte}</div>
            <div className="col-span-1">
              <span
                className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase ${
                  e.status === "aberto"
                    ? "bg-foreground text-background"
                    : "hairline text-muted-foreground"
                }`}
              >
                {e.status}
              </span>
            </div>
            <div className="col-span-1 font-mono text-xs text-muted-foreground">
              {e.tipo_apoio ?? "—"}
            </div>
            <div className="col-span-1 text-right font-mono text-xs">
              {e.data_encerramento
                ? new Date(e.data_encerramento).toLocaleDateString("pt-BR")
                : "—"}
            </div>
            <div className="col-span-1 text-right font-mono text-xs">
              {Math.round(e.confianca_extracao * 100)}%
            </div>
            <div className="col-span-2 flex justify-end gap-3 font-mono text-xs">
              {e.precisa_revisao && <span className="text-destructive">revisar</span>}
              <button
                onClick={() => mut.mutate({ id: e.id, oculto: !e.oculto })}
                className="text-muted-foreground hover:text-foreground"
              >
                {e.oculto ? "reexibir" : "ocultar"}
              </button>
            </div>
          </div>
        ))}
        {!isLoading && data.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Nenhum edital ainda. Rode o robô em <span className="font-mono">/admin/fontes</span>.
          </div>
        )}
      </div>
    </div>
  );
}
