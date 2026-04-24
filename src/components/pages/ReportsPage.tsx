import { useMemo, useState } from "react";
import { usePOS, formatKsh } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TreePine, Package, TrendingUp } from "lucide-react";

type Range = "today" | "week" | "month";

export function ReportsPage() {
  const { sales, hardware, timber } = usePOS();
  const [range, setRange] = useState<Range>("week");

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "today" ? 86400000 : range === "week" ? 7 * 86400000 : 30 * 86400000;
    return sales.filter((s) => now - new Date(s.date).getTime() <= cutoff);
  }, [sales, range]);

  const totalRev = filtered.reduce((s, x) => s + x.total, 0);
  const cashRev = filtered.filter((s) => s.payment !== "credit").reduce((s, x) => s + x.total, 0);
  const creditRev = filtered.filter((s) => s.payment === "credit").reduce((s, x) => s + x.total, 0);
  const avgSale = filtered.length ? totalRev / filtered.length : 0;

  // Daily series
  const days = range === "today" ? 1 : range === "week" ? 7 : 30;
  const series = Array.from({ length: days }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const label = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    const dayKey = d.toDateString();
    const total = sales
      .filter((s) => new Date(s.date).toDateString() === dayKey)
      .reduce((sum, s) => sum + s.total, 0);
    return { label, total };
  });
  const max = Math.max(...series.map((s) => s.total), 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7" /> Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sales, profit & inventory insights.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(["today", "week", "month"] as Range[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "ghost"}
              size="sm"
              onClick={() => setRange(r)}
              className="capitalize"
            >
              {r}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={formatKsh(totalRev)} icon={TrendingUp} />
        <StatCard label="Transactions" value={filtered.length.toString()} icon={BarChart3} />
        <StatCard label="Cash / Card / M-Pesa" value={formatKsh(cashRev)} />
        <StatCard label="Credit Sales" value={formatKsh(creditRev)} />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Revenue Trend</h2>
        <p className="text-xs text-muted-foreground mb-4">Average sale: {formatKsh(avgSale)}</p>
        <div className="flex items-end gap-2 h-48">
          {series.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="text-[10px] font-semibold text-muted-foreground">
                {d.total > 0 ? formatKsh(d.total).replace("KSh ", "") : ""}
              </div>
              <div
                className="w-full rounded-t-md bg-[image:var(--gradient-amber)] min-h-[2px] transition-all"
                style={{ height: `${(d.total / max) * 100}%` }}
              />
              <div className="text-[10px] text-muted-foreground truncate">{d.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TreePine className="h-5 w-5 text-timber" /> Timber Stock
          </h2>
          <div className="space-y-2">
            {timber.map((t) => {
              const totalCapacity = 300;
              const pct = Math.min(100, (t.pieces / totalCapacity) * 100);
              return (
                <div key={t.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-muted-foreground">{t.pieces} pcs</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[image:var(--gradient-timber)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Package className="h-5 w-5 text-hardware" /> Top Hardware (by value)
          </h2>
          <div className="space-y-2">
            {[...hardware]
              .sort((a, b) => b.price * b.stock - a.price * a.stock)
              .slice(0, 6)
              .map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium">{h.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {h.stock} {h.unit} @ {formatKsh(h.price)}
                    </div>
                  </div>
                  <div className="text-sm font-bold">{formatKsh(h.price * h.stock)}</div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-3">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2">Date</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Payment</th>
                <th className="py-2 text-right">Subtotal</th>
                <th className="py-2 text-right">Discount</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 15).map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="py-2 text-muted-foreground">
                    {new Date(s.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 font-medium">{s.customerName}</td>
                  <td className="py-2 uppercase text-xs font-semibold">{s.payment}</td>
                  <td className="py-2 text-right">{formatKsh(s.subtotal)}</td>
                  <td className="py-2 text-right text-success">−{formatKsh(s.discount)}</td>
                  <td className="py-2 text-right font-bold">{formatKsh(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof BarChart3;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-xl font-bold mt-1">{value}</div>
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
    </Card>
  );
}
