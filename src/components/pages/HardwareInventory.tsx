import { useState, useMemo } from "react";
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
import { Package, Plus, Search, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useBranchSelection,
  useHardware,
  useSuppliers,
  upsertHardware,
  deleteHardware,
  formatKsh,
  type CloudHardware,
} from "@/lib/cloud-store";
import { toast } from "sonner";

const UNITS = ["piece", "kg", "meter", "box", "bag", "ft", "litre"];
const DEFAULT_CATEGORIES = ["Tools", "Fasteners", "Plumbing", "Electrical", "Paint", "Building", "Other"];

const blank = {
  id: undefined as string | undefined,
  name: "",
  sku: "",
  barcode: "",
  category: "Tools",
  unit: "piece",
  price: 0,
  price_wholesale: 0,
  price_contractor: 0,
  cost: 0,
  stock: 0,
  low_stock_threshold: 5,
  supplier_id: null as string | null,
};

export function HardwareInventory() {
  const { activeBusinessId } = useAuth();
  const { activeBranchId } = useBranchSelection();
  const { items, loading, reload } = useHardware(activeBranchId);
  const { items: suppliers } = useSuppliers();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    items.forEach((h) => h.category && set.add(h.category));
    return Array.from(set).sort();
  }, [items]);

  const filtered = items.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return h.name.toLowerCase().includes(q) || (h.sku ?? "").toLowerCase().includes(q);
  });

  const lowStockCount = items.filter((h) => Number(h.stock) <= Number(h.low_stock_threshold)).length;
  const totalValue = items.reduce((sum, h) => sum + Number(h.price) * Number(h.stock), 0);

  function startNew() {
    setForm(blank);
    setOpen(true);
  }
  function startEdit(h: CloudHardware) {
    setForm({
      id: h.id,
      name: h.name,
      sku: h.sku ?? "",
      barcode: h.barcode ?? "",
      category: h.category ?? "Tools",
      unit: h.unit,
      price: Number(h.price),
      price_wholesale: Number(h.price_wholesale),
      price_contractor: Number(h.price_contractor),
      cost: Number(h.cost),
      stock: Number(h.stock),
      low_stock_threshold: Number(h.low_stock_threshold),
      supplier_id: h.supplier_id,
    });
    setOpen(true);
  }

  async function save() {
    if (!activeBusinessId || !activeBranchId) {
      toast.error("Select a branch first");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await upsertHardware({
        id: form.id,
        business_id: activeBusinessId,
        branch_id: activeBranchId,
        name: form.name.trim(),
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
        category: form.category,
        unit: form.unit,
        price: Number(form.price) || 0,
        price_wholesale: Number(form.price_wholesale) || 0,
        price_contractor: Number(form.price_contractor) || 0,
        cost: Number(form.cost) || 0,
        stock: Number(form.stock) || 0,
        low_stock_threshold: Number(form.low_stock_threshold) || 0,
        supplier_id: form.supplier_id,
      });
      toast.success(form.id ? "Item updated" : "Item added");
      setOpen(false);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(h: CloudHardware) {
    if (!confirm(`Remove "${h.name}" from inventory?`)) return;
    try {
      await deleteHardware(h.id);
      toast.success("Item removed");
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
            <Package className="h-6 w-6" /> Hardware Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} items · {lowStockCount} low-stock · Stock value{" "}
            <span className="font-semibold text-foreground">{formatKsh(totalValue)}</span>
          </p>
        </div>
        <Button onClick={startNew} disabled={!activeBranchId}>
          <Plus className="h-4 w-4 mr-1" /> Add item
        </Button>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No items yet for this branch.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((h) => {
              const low = Number(h.stock) <= Number(h.low_stock_threshold);
              const supplierName = suppliers.find((s) => s.id === h.supplier_id)?.name;
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="text-muted-foreground">{h.sku ?? "-"}</TableCell>
                  <TableCell>{h.category ?? "-"}</TableCell>
                  <TableCell className="text-right">{formatKsh(Number(h.price))}</TableCell>
                  <TableCell className="text-right">
                    {low && <AlertTriangle className="h-3.5 w-3.5 text-destructive inline mr-1" />}
                    <span className={low ? "text-destructive font-semibold" : ""}>
                      {Number(h.stock)} {h.unit}
                    </span>
                  </TableCell>
                  <TableCell>{supplierName ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(h)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(h)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit item" : "Add hardware item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">SKU</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Barcode (scan or type)</label>
              <Input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="EAN / UPC"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Unit</label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Retail (KSh)</label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Wholesale</label>
                <Input type="number" value={form.price_wholesale} onChange={(e) => setForm({ ...form, price_wholesale: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Contractor</label>
                <Input type="number" value={form.price_contractor} onChange={(e) => setForm({ ...form, price_contractor: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Cost (KSh)</label>
                <Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Stock</label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Low-stock</label>
                <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Low-stock threshold</label>
                <Input
                  type="number"
                  value={form.low_stock_threshold}
                  onChange={(e) =>
                    setForm({ ...form, low_stock_threshold: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium">Supplier</label>
                <Select
                  value={form.supplier_id ?? "none"}
                  onValueChange={(v) =>
                    setForm({ ...form, supplier_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— none —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
