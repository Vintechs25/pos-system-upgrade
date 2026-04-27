import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Users,
  Receipt,
  TreePine,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  useBranchSelection,
  useHardware,
  useTimber,
  useCustomers,
  useSales,
  formatKsh,
} from "@/lib/cloud-store";

export function Dashboard() {
  const { activeBranchId } = useBranchSelection();
  const { items: hardware } = useHardware(activeBranchId);
  const { items: timber } = useTimber(activeBranchId);
  const { items: customers } = useCustomers();
  const { items: sales } = useSales(activeBranchId, true);

  const today = new Date().toDateString();
  const todaysSales = sales.filter((s) => new Date(s.created_at).toDateString() === today);
  const todayRevenue = todaysSales.reduce((sum, s) => sum + Number(s.total), 0);
  const lowStock = hardware.filter((h) => Number(h.stock) <= Number(h.low_stock_threshold));
  const outstanding = customers.reduce((sum, c) => sum + Number(c.balance), 0);
  const lowTimber = timber.filter((t) => Number(t.pieces) <= Number(t.low_stock_threshold));

  const cards = [
    { label: "Today's revenue", value: formatKsh(todayRevenue), sub: `${todaysSales.length} transactions`, icon: TrendingUp },
    { label: "Hardware items", value: String(hardware.length), sub: `${lowStock.length} low stock`, icon: ShoppingCart },
    { label: "Timber sizes", value: String(timber.length), sub: `${lowTimber.length} need restock`, icon: TreePine },
    { label: "Outstanding credit", value: formatKsh(outstanding), sub: `${customers.length} customers`, icon: Users },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time view of your branch.</p>
        </div>
        <Button asChild>
          <Link to="/pos"><Receipt className="h-4 w-4 mr-1" /> New sale</Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase font-bold text-muted-foreground">{c.label}</div>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Low stock alerts
          </h2>
          <div className="space-y-1">
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground">All items healthy.</p>}
            {lowStock.slice(0, 6).map((h) => (
              <div key={h.id} className="flex justify-between text-sm py-1 border-b border-border">
                <span>{h.name}</span>
                <span className="text-destructive font-semibold">{Number(h.stock)} {h.unit}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent sales</h2>
          <div className="space-y-1">
            {sales.slice(0, 6).map((s) => (
              <div key={s.id} className="flex justify-between text-sm py-1 border-b border-border">
                <span className="truncate">{s.customer_name ?? "Walk-in"} · {s.payment_method}</span>
                <span className="font-semibold">{formatKsh(Number(s.total))}</span>
              </div>
            ))}
            {sales.length === 0 && <p className="text-sm text-muted-foreground">No sales yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
