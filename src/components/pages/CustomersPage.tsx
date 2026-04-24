import { useState } from "react";
import { usePOS, formatKsh } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, HardHat, User as UserIcon, Phone } from "lucide-react";

export function CustomersPage() {
  const { customers, sales, addCustomer } = usePOS();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "contractor" as "walk-in" | "contractor",
    company: "",
    phone: "",
    creditLimit: 50000,
    discountPct: 0,
  });

  const totalOutstanding = customers.reduce((s, c) => s + c.balance, 0);
  const totalCredit = customers.reduce((s, c) => s + c.creditLimit, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Customers & Credit
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Contractor accounts, balances and custom pricing.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</div>
          <div className="text-2xl font-bold mt-1 text-warning">{formatKsh(totalOutstanding)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Credit Lines</div>
          <div className="text-2xl font-bold mt-1">{formatKsh(totalCredit)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Active Contractors</div>
          <div className="text-2xl font-bold mt-1">
            {customers.filter((c) => c.type === "contractor").length}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customers
          .filter((c) => c.id !== "c-walkin")
          .map((c) => {
            const customerSales = sales.filter((s) => s.customerId === c.id);
            const utilPct = c.creditLimit > 0 ? (c.balance / c.creditLimit) * 100 : 0;
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {c.type === "contractor" ? (
                        <HardHat className="h-5 w-5 text-primary" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{c.name}</div>
                      {c.company && (
                        <div className="text-xs text-muted-foreground">{c.company}</div>
                      )}
                      {c.phone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  {c.discountPct > 0 && (
                    <span className="rounded-full bg-accent/20 text-accent-foreground border border-accent/30 px-2 py-0.5 text-[10px] font-bold uppercase">
                      {c.discountPct}% off
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Balance
                    </div>
                    <div className={`font-bold ${c.balance > 0 ? "text-warning" : "text-success"}`}>
                      {formatKsh(c.balance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Credit Limit
                    </div>
                    <div className="font-bold">{formatKsh(c.creditLimit)}</div>
                  </div>
                </div>

                {c.creditLimit > 0 && (
                  <div className="mb-3">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full ${utilPct > 80 ? "bg-destructive" : utilPct > 50 ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.min(100, utilPct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {utilPct.toFixed(0)}% utilized
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  {customerSales.length} sales · Last:{" "}
                  {customerSales[0]
                    ? new Date(customerSales[0].date).toLocaleDateString()
                    : "—"}
                </div>
              </Card>
            );
          })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "walk-in" | "contractor" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Credit limit" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
              <Input type="number" placeholder="Discount %" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                addCustomer(form);
                setOpen(false);
                setForm({ name: "", type: "contractor", company: "", phone: "", creditLimit: 50000, discountPct: 0 });
              }}
              disabled={!form.name}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
