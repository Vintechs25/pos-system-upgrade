import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TreePine,
  Users,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; highlight?: boolean };
const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pos", label: "Point of Sale", icon: ShoppingCart, highlight: true },
  { to: "/timber", label: "Timber Yard", icon: TreePine },
  { to: "/inventory", label: "Hardware", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

function NavList({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {nav.map((item) => {
        const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
        return (
          <Link
            key={item.to}
            to={item.to as "/"}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              item.highlight && !active && "text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {item.highlight && !active && (
              <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-foreground">
                F2
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-timber)] text-timber-foreground">
        <TreePine className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight text-foreground leading-none">
          TimberYard
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
          Hardware POS
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const path = location.pathname;
  const [open, setOpen] = useState(false);

  const currentLabel = nav.find((n) =>
    n.to === "/" ? path === "/" : path.startsWith(n.to),
  )?.label;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <Brand />
        </div>
        <NavList path={path} />
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-secondary p-3 text-xs">
            <div className="font-semibold text-foreground">Yard Open</div>
            <div className="text-muted-foreground">Mon–Sat · 7am–6pm</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2.5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 flex flex-col">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
                <Brand />
              </div>
              <NavList path={path} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <div className="text-sm font-bold text-foreground truncate">
              {currentLabel ?? "TimberYard"}
            </div>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label="Quick sale">
            <Link to="/pos">
              <ShoppingCart className="h-5 w-5 text-accent" />
            </Link>
          </Button>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>

        {/* Mobile bottom tab bar — quick access */}
        <nav className="md:hidden sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card">
          {nav
            .filter((n) => n.to !== "/customers")
            .slice(0, 5)
            .map((item) => {
              const active = path === item.to || (item.to !== "/" && path.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to as "/"}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
                    active ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate max-w-full px-1">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
        </nav>
      </div>
    </div>
  );
}
