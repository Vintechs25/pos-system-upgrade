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
import { TreePine, Plus, Ruler } from "lucide-react";

export function TimberInventory() {
  const { timber, addTimber } = usePOS();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    pieces: 100,
    multiplier: 1,
    quickLengths: "10,12,14",
    sizes: "2x4:35,4x4:75",
  });

  function submit() {
    addTimber({
      name: form.name,
      description: form.description,
      pieces: form.pieces,
      multiplier: form.multiplier,
      quickLengths: form.quickLengths.split(",").map((n) => Number(n.trim())).filter(Boolean),
      sizes: form.sizes.split(",").map((s, i) => {
        const [label, rate] = s.split(":");
        return {
          id: `s-new-${Date.now()}-${i}`,
          label: label.trim(),
          ratePerFt: Number(rate) || 0,
        };
      }),
    });
    setOpen(false);
    setForm({ name: "", description: "", pieces: 100, multiplier: 1, quickLengths: "10,12,14", sizes: "2x4:35,4x4:75" });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TreePine className="h-7 w-7 text-timber" /> Timber Yard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage wood types, dimensions and per-foot pricing.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg" className="bg-timber text-timber-foreground hover:bg-timber/90">
          <Plus className="mr-2 h-4 w-4" /> Add Wood Type
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {timber.map((w) => (
          <Card key={w.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{w.name}</h3>
                <p className="text-xs text-muted-foreground">{w.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">{w.pieces}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  pieces
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Sizes & Rates (per ft, ×{w.multiplier})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {w.sizes.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md bg-secondary px-3 py-2"
                  >
                    <span className="text-sm font-bold">{s.label}</span>
                    <span className="text-sm">{formatKsh(s.ratePerFt * w.multiplier)}/ft</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
              <Ruler className="h-3 w-3" />
              Quick lengths: {w.quickLengths.map((l) => `${l}ft`).join(" · ")}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Wood Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name (e.g. Mvule)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Pieces" value={form.pieces} onChange={(e) => setForm({ ...form, pieces: Number(e.target.value) })} />
              <Input type="number" step="0.05" placeholder="Price multiplier" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: Number(e.target.value) })} />
            </div>
            <Input placeholder="Quick lengths e.g. 10,12,14" value={form.quickLengths} onChange={(e) => setForm({ ...form, quickLengths: e.target.value })} />
            <Input placeholder="Sizes e.g. 2x4:35,4x4:75" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
            <p className="text-xs text-muted-foreground">Sizes format: dimension:rate-per-ft (comma separated)</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!form.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
