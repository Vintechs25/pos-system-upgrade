import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Plus, Pencil, Trash2, HardHat, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useCustomers,
  upsertCustomer,
  deleteCustomer,
  formatKsh,
  type CloudCustomer,
} from "@/lib/cloud-store";
import { toast } from "sonner";

const blank = {
  id: undefined as string | undefined,
  name: "",
  type: "contractor" as "walk-in" | "contractor",
  phone: "",
  price_tier: "retail" as "retail" | "wholesale" | "contractor",
  credit_limit: 50000,
  loyalty_discount_pct: 0,
};

export function CustomersPage() {
  const { activeBusinessId } = useAuth();
  const { items, loading, reload } = useCustomers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const totalOutstanding = items.reduce((s, c) => s + Number(c.balance), 0);
  const totalCredit = items.reduce((s, c) => s + Number(c.credit_limit), 0);

  function startNew() {
    setForm(blank);
    setOpen(true);
  }
  function startEdit(c: CloudCustomer) {
    setForm({
      id: c.id,
      name: c.name,
      type: (c.type as "walk-in" | "contractor") ?? "walk-in",
      phone: c.phone ?? "",
      price_tier: (c.price_tier as "retail" | "wholesale" | "contractor") ?? "retail",
      credit_limit: Number(c.credit_limit),
      loyalty_discount_pct: Number(c.loyalty_discount_pct),
    });
    setOpen(true);
  }

  async function save() {
    if (!activeBusinessId) {
      toast.error("Select a business first");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await upsertCustomer({
        id: form.id,
        business_id: activeBusinessId,
        name: form.name.trim(),
        type: form.type,
        phone: form.phone.trim() || null,
        price_tier: form.price_tier,
        credit_limit: form.credit_limit,
        loyalty_discount_pct: form.loyalty_discount_pct,
      });
      toast.success(form.id ? "Customer updated" : "Customer added");
      setOpen(false);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(c: CloudCustomer) {
    if (Number(c.balance) > 0) {
      toast.error("Customer has an outstanding balance");
      return;
    }
    if (!confirm(`Delete customer "${c.name}"?`)) return;
    try {
      await deleteCustomer(c.id);
      toast.success("Customer removed");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" /> Customers & Credit
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} customers · Outstanding{" "}
            <span className="font-semibold text-destructive">{formatKsh(totalOutstanding)}</span>{" "}
            of {formatKsh(totalCredit)} credit
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-1" /> Add customer
        </Button>
      </header>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Credit limit</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Loyalty %</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No customers yet.</TableCell></TableRow>
            )}
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {c.type === "contractor" ? <HardHat className="h-4 w-4 text-accent" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                  {c.name}
                </TableCell>
                <TableCell className="capitalize">{c.type}</TableCell>
                <TableCell>{c.phone ?? "-"}</TableCell>
                <TableCell className="text-right">{formatKsh(Number(c.credit_limit))}</TableCell>
                <TableCell className={"text-right " + (Number(c.balance) > 0 ? "text-destructive font-semibold" : "")}>
                  {formatKsh(Number(c.balance))}
                </TableCell>
                <TableCell className="text-right">{Number(c.loyalty_discount_pct)}%</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit customer" : "Add customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "walk-in" | "contractor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Price tier</label>
                <Select value={form.price_tier} onValueChange={(v) => setForm({ ...form, price_tier: v as "retail" | "wholesale" | "contractor" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Credit limit</label>
                <Input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Loyalty %</label>
                <Input type="number" value={form.loyalty_discount_pct} onChange={(e) => setForm({ ...form, loyalty_discount_pct: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
