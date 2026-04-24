import { useState, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Search, AlertTriangle } from "lucide-react";
import type { UnitType } from "@/lib/types";

const UNITS: UnitType[] = ["piece", "kg", "meter", "box", "bag", "ft"];

export function HardwareInventory() {
  const { hardware, addHardware } = usePOS();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "Tools",
    unit: "piece" as UnitType,
    price: 0,
    stock: 0,
    reorderLevel: 5,
    supplier: "",
  });

  const categories = useMemo(
    () => Array.from(new Set(hardware.map((h) => h.category))).sort(),
    [hardware],
  );

  const filtered = hardware.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || h.sku.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7 text-hardware" /> Hardware Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All non-timber stock — tools, fasteners, cement, pipes and more.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </header>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((h) => {
              const low = h.stock <= h.reorderLevel;
              const out = h.stock === 0;
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{h.sku}</TableCell>
                  <TableCell>
                    <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                      {h.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatKsh(h.price)}</TableCell>
                  <TableCell className="text-right">
                    {h.stock} <span className="text-xs text-muted-foreground">{h.unit}</span>
                  </TableCell>
                  <TableCell>
                    {out ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Out
                      </span>
                    ) : low ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-warning">
                        <AlertTriangle className="h-3 w-3" /> Low
                      </span>
                    ) : (
                      <span className="text-xs font-semibold uppercase text-success">In Stock</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hardware Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <Input placeholder="Category" list="cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v as UnitType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Reorder level" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} />
              <Input placeholder="Supplier (optional)" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                addHardware(form);
                setOpen(false);
                setForm({ name: "", sku: "", category: "Tools", unit: "piece", price: 0, stock: 0, reorderLevel: 5, supplier: "" });
              }}
              disabled={!form.name || !form.sku}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
