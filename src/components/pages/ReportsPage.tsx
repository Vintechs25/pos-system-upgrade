import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TreePine, Package, TrendingUp } from "lucide-react";
import { useBranchSelection, useSales, useHardware, useTimber, formatKsh } from "@/lib/cloud-store";

type Range = "today" | "week" | "month";

export function ReportsPage() {
  const { activeBranchId } = useBranchSelection();
  const { items: sales } = useSales(activeBranchId, true);
  const { items: hardware } = useHardware(activeBranchId);
  const { items: timber } = useTimber(activeBranchId);
  const [range, setRange] = useState<Range>("week");

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = range === "today" ? 86400000 : range === "week" ? 7 * 86400000 : 30 * 86400000;
    return sales.filter((s) => now - new Date(s.created_at).getTime() <= cutoff);
  }, [sales, range]);

  const totalRev = filtered.reduce((s, x) => s + Number(x.total), 0);
  const cashRev = filtered.filter((s) => s.payment_method !== "credit").reduce((s, x) => s + Number(x.total), 0);
  const creditRev = filtered.filter((s) => s.payment_method === "credit").reduce((s, x) => s + Number(x.total), 0);
  const mpesaRev = filtered.filter((s) => s.payment_method === "mpesa").reduce((s, x) => s + Number(x.total), 0);
  const avgSale = filtered.length ? totalRev / filtered.length : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Reports
          </h1>
          <p className="text-sm text-muted-foreground">Performance over the last period.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border p-1">
          {(["today", "week", "month"] as Range[]).map((r) => (
            <Button key={r} variant={range === r ? "default" : "ghost"} size="sm" onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs uppercase font-bold text-muted-foreground">Total revenue</div>
          <div className="text-2xl font-bold mt-2">{formatKsh(totalRev)}</div>
          <div className="text-xs text-muted-foreground">{filtered.length} sales</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase font-bold text-muted-foreground">Cash + Card + M-Pesa</div>
          <div className="text-2xl font-bold mt-2">{formatKsh(cashRev)}</div>
          <div className="text-xs text-muted-foreground">M-Pesa: {formatKsh(mpesaRev)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase font-bold text-muted-foreground">On credit</div>
          <div className="text-2xl font-bold mt-2">{formatKsh(creditRev)}</div>
          <div className="text-xs text-muted-foreground">to be collected</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase font-bold text-muted-foreground">Avg sale</div>
          <div className="text-2xl font-bold mt-2">{formatKsh(avgSale)}</div>
          <div className="text-xs text-muted-foreground">per transaction</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" /> Hardware inventory ({hardware.length})
          </h2>
          <div className="text-sm text-muted-foreground">
            Stock value: <span className="font-semibold text-foreground">
              {formatKsh(hardware.reduce((s, h) => s + Number(h.price) * Number(h.stock), 0))}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <TreePine className="h-4 w-4 text-timber" /> Timber stock ({timber.length})
          </h2>
          <div className="text-sm text-muted-foreground">
            Total pieces: <span className="font-semibold text-foreground">
              {timber.reduce((s, t) => s + Number(t.pieces), 0)}
            </span>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Recent sales
        </h2>
        <div className="space-y-1">
          {filtered.slice(0, 15).map((s) => (
            <div key={s.id} className="flex justify-between text-sm py-1.5 border-b border-border">
              <div className="truncate">
                <span className="font-medium">{s.receipt_no ?? s.id.slice(0, 8)}</span>
                <span className="text-muted-foreground ml-2">{s.customer_name ?? "Walk-in"}</span>
                <span className="text-muted-foreground ml-2 capitalize">· {s.payment_method}</span>
              </div>
              <span className="font-semibold">{formatKsh(Number(s.total))}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No sales in this period.</p>}
        </div>
      </Card>
    </div>
  );
}
