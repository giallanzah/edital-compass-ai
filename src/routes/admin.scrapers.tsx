import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/scrapers")({
  component: Scrapers,
});

const scrapers = [
  { name: "cnpq.crawl", schedule: "0 */8 * * *", last: "02:14", status: "ok", found: 3 },
  { name: "finep.crawl", schedule: "0 */8 * * *", last: "02:08", status: "ok", found: 1 },
  { name: "sebrae.crawl", schedule: "0 6,18 * * *", last: "06:02", status: "ok", found: 0 },
  { name: "bndes.crawl", schedule: "0 */12 * * *", last: "01:30", status: "fail", found: 0 },
  { name: "fapesp.crawl", schedule: "0 */8 * * *", last: "01:55", status: "ok", found: 2 },
  { name: "faperj.crawl", schedule: "0 4,16 * * *", last: "04:11", status: "ok", found: 0 },
  { name: "fapemig.crawl", schedule: "0 5,17 * * *", last: "05:09", status: "warn", found: 0 },
  { name: "leidobem.parse", schedule: "0 9 * * 1", last: "Mon 09:00", status: "ok", found: 0 },
];

function Scrapers() {
  return (
    <div className="px-8 py-10">
      <div className="eyebrow mb-2">Pipelines</div>
      <h1 className="text-3xl font-medium tracking-tight">Scrapers</h1>

      <div className="mt-8 hairline">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 hairline-b eyebrow">
          <div className="col-span-3">Job</div>
          <div className="col-span-3">Schedule (cron)</div>
          <div className="col-span-2">Última execução</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Novos</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        {scrapers.map((s) => (
          <div
            key={s.name}
            className="grid grid-cols-12 items-center gap-4 px-5 py-3 hairline-b last:border-0 font-mono text-xs hover:bg-secondary"
          >
            <div className="col-span-3 text-foreground">{s.name}</div>
            <div className="col-span-3 text-muted-foreground">{s.schedule}</div>
            <div className="col-span-2 text-muted-foreground">{s.last}</div>
            <div className="col-span-1">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    s.status === "ok"
                      ? "bg-foreground"
                      : s.status === "warn"
                      ? "bg-muted-foreground"
                      : "bg-destructive"
                  }`}
                />
                {s.status}
              </span>
            </div>
            <div className="col-span-1 text-right">{s.found}</div>
            <div className="col-span-2 flex justify-end gap-3 text-muted-foreground">
              <button className="hover:text-foreground">run</button>
              <button className="hover:text-foreground">logs</button>
              <button className="hover:text-foreground">edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
