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
import { TreePine, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useBranchSelection,
  useTimber,
  upsertTimber,
  deleteTimber,
  formatKsh,
  type CloudTimber,
} from "@/lib/cloud-store";
import { toast } from "sonner";

const blank = {
  id: undefined as string | undefined,
  species: "",
  grade: "",
  thickness: 2,
  width: 4,
  length: 12,
  dim_unit: "in",
  length_unit: "ft",
  price_per_unit: 50,
  price_unit: "ft",
  pieces: 0,
  low_stock_threshold: 10,
};

export function TimberInventory() {
  const { activeBusinessId } = useAuth();
  const { activeBranchId } = useBranchSelection();
  const { items, loading, reload } = useTimber(activeBranchId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  function startNew() {
    setForm(blank);
    setOpen(true);
  }
  function startEdit(t: CloudTimber) {
    setForm({
      id: t.id,
      species: t.species,
      grade: t.grade ?? "",
      thickness: Number(t.thickness),
      width: Number(t.width),
      length: Number(t.length),
      dim_unit: t.dim_unit,
      length_unit: t.length_unit,
      price_per_unit: Number(t.price_per_unit),
      price_unit: t.price_unit,
      pieces: Number(t.pieces),
      low_stock_threshold: Number(t.low_stock_threshold),
    });
    setOpen(true);
  }

  async function save() {
    if (!activeBusinessId || !activeBranchId) {
      toast.error("Select a branch first");
      return;
    }
    if (!form.species.trim()) {
      toast.error("Species is required");
      return;
    }
    try {
      await upsertTimber({
        id: form.id,
        business_id: activeBusinessId,
        branch_id: activeBranchId,
        species: form.species.trim(),
        grade: form.grade.trim() || null,
        thickness: form.thickness,
        width: form.width,
        length: form.length,
        dim_unit: form.dim_unit,
        length_unit: form.length_unit,
        price_per_unit: form.price_per_unit,
        price_unit: form.price_unit,
        pieces: form.pieces,
        low_stock_threshold: form.low_stock_threshold,
      });
      toast.success(form.id ? "Updated" : "Added");
      setOpen(false);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(t: CloudTimber) {
    if (!confirm(`Remove ${t.species} ${t.thickness}x${t.width}?`)) return;
    try {
      await deleteTimber(t.id);
      toast.success("Removed");
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
            <TreePine className="h-6 w-6 text-timber" /> Timber Yard
          </h1>
          <p className="text-sm text-muted-foreground">{items.length} stocked sizes</p>
        </div>
        <Button onClick={startNew} disabled={!activeBranchId}>
          <Plus className="h-4 w-4 mr-1" /> Add timber
        </Button>
      </header>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Species</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Length</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Pieces</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No timber stocked.</TableCell></TableRow>
            )}
            {items.map((t) => {
              const low = Number(t.pieces) <= Number(t.low_stock_threshold);
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.species}</TableCell>
                  <TableCell>{t.grade ?? "-"}</TableCell>
                  <TableCell>{Number(t.thickness)}×{Number(t.width)} {t.dim_unit}</TableCell>
                  <TableCell>{Number(t.length)} {t.length_unit}</TableCell>
                  <TableCell className="text-right">{formatKsh(Number(t.price_per_unit))} / {t.price_unit}</TableCell>
                  <TableCell className={"text-right " + (low ? "text-destructive font-semibold" : "")}>
                    {Number(t.pieces)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(t)}>
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
            <DialogTitle>{form.id ? "Edit timber" : "Add timber"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Species</label>
                <Input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} placeholder="e.g. Cypress" />
              </div>
              <div>
                <label className="text-xs font-medium">Grade</label>
                <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="e.g. A" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Thickness</label>
                <Input type="number" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Width</label>
                <Input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Dim unit</label>
                <Select value={form.dim_unit} onValueChange={(v) => setForm({ ...form, dim_unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">inches</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Length</label>
                <Input type="number" value={form.length} onChange={(e) => setForm({ ...form, length: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Length unit</label>
                <Select value={form.length_unit} onValueChange={(v) => setForm({ ...form, length_unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Pieces in stock</label>
                <Input type="number" value={form.pieces} onChange={(e) => setForm({ ...form, pieces: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium">Price</label>
                <Input type="number" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium">Price unit</label>
                <Select value={form.price_unit} onValueChange={(v) => setForm({ ...form, price_unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft">per ft</SelectItem>
                    <SelectItem value="m">per m</SelectItem>
                    <SelectItem value="piece">per piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Low-stock</label>
                <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
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
