import { usePOS, formatKsh } from "@/lib/store";
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

export function Dashboard() {
  const { sales, hardware, timber, customers } = usePOS();

  const today = new Date().toDateString();
  const todaysSales = sales.filter((s) => new Date(s.date).toDateString() === today);
  const todayRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = hardware.filter((h) => h.stock <= h.reorderLevel);
  const outstanding = customers.reduce((sum, c) => sum + c.balance, 0);
  const lowTimber = timber.filter((t) => t.pieces < 100);

  const cards = [
    {
      label: "Today's Revenue",
      value: formatKsh(todayRevenue),
      sub: `${todaysSales.length} transactions`,
      icon: TrendingUp,
      tone: "bg-[image:var(--gradient-amber)] text-accent-foreground",
    },
    {
      label: "Sales Today",
      value: todaysSales.length.toString(),
      sub: "across all categories",
      icon: ShoppingCart,
      tone: "bg-primary text-primary-foreground",
    },
    {
      label: "Outstanding Credit",
      value: formatKsh(outstanding),
      sub: `${customers.filter((c) => c.balance > 0).length} accounts`,
      icon: Receipt,
      tone: "bg-card text-foreground border border-border",
    },
    {
      label: "Low Stock Alerts",
      value: (lowStock.length + lowTimber.length).toString(),
      sub: "items need restocking",
      icon: AlertTriangle,
      tone: "bg-card text-foreground border border-border",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Yard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/pos">
            <ShoppingCart className="mr-2 h-5 w-5" /> Open Point of Sale
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            className={`p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition-shadow ${c.tone}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider opacity-80">
                  {c.label}
                </div>
                <div className="text-2xl font-bold mt-2">{c.value}</div>
                <div className="text-xs opacity-70 mt-1">{c.sub}</div>
              </div>
              <c.icon className="h-5 w-5 opacity-70" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Sales</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports">View all</Link>
            </Button>
          </div>
          <div className="space-y-2">
            {sales.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{s.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.date).toLocaleString("en-KE", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    <span className="uppercase">{s.payment}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">{formatKsh(s.total)}</div>
                  {s.status === "credit" && (
                    <div className="text-[10px] uppercase font-semibold text-warning">
                      On Credit
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Stock Alerts</h2>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div className="space-y-3">
            {lowTimber.length === 0 && lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">All stock healthy.</p>
            )}
            {lowTimber.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <TreePine className="h-4 w-4 text-timber" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.pieces} pieces left</div>
                </div>
              </div>
            ))}
            {lowStock.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-sm bg-hardware" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{h.name}</div>
                  <div className="text-xs text-warning">
                    {h.stock} {h.unit} (reorder at {h.reorderLevel})
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4" asChild>
            <Link to="/inventory">
              <Users className="mr-2 h-4 w-4" />
              Manage Inventory
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
