import { useState } from "react";
import type { CloudTimber } from "@/lib/cloud-store";
import { formatKsh } from "@/lib/cloud-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TreePine, Ruler, Plus, Minus } from "lucide-react";

interface Props {
  wood: CloudTimber;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: {
    productId: string;
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unitLabel: string;
    meta: { species: string; size: string; length: number; pieces: number };
  }) => void;
}

export function TimberSaleDialog({ wood, open, onOpenChange, onAdd }: Props) {
  const defaultLength = Number(wood.length) || 12;
  const [length, setLength] = useState<number>(defaultLength);
  const [pieces, setPieces] = useState<number>(1);
  const [override, setOverride] = useState<string>("");

  const ratePerUnit = Number(wood.price_per_unit);
  // If priced per ft/m we multiply by length; if per piece we just use rate.
  const computed =
    wood.price_unit === "piece" ? ratePerUnit * pieces : ratePerUnit * length * pieces;
  const overrideNum = parseFloat(override);
  const total = !isNaN(overrideNum) && override !== "" ? overrideNum : computed;
  const bulkDisc = pieces >= 20 ? 10 : pieces >= 10 ? 5 : 0;
  const finalTotal = total * (1 - bulkDisc / 100);
  const sizeLabel = `${Number(wood.thickness)}×${Number(wood.width)} ${wood.dim_unit}`;

  function handleAdd() {
    onAdd({
      productId: wood.id,
      name: `${wood.species} ${sizeLabel}`,
      description: `${length}${wood.length_unit} × ${pieces} pcs${bulkDisc ? ` · ${bulkDisc}% bulk` : ""}`,
      quantity: pieces,
      unitPrice: finalTotal / Math.max(1, pieces),
      unitLabel: "pc",
      meta: { species: wood.species, size: sizeLabel, length, pieces },
    });
    onOpenChange(false);
    setPieces(1);
    setOverride("");
  }

  const quickLengths = [defaultLength, defaultLength * 0.75, defaultLength * 1.25].map((n) =>
    Math.round(n),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TreePine className="h-5 w-5 text-timber" />
            {wood.species} {sizeLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Length ({wood.length_unit})
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickLengths.map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition-all ${
                    length === l
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                >
                  {l} {wood.length_unit}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value) || 0)}
                className="h-9"
                min={1}
              />
              <span className="text-sm text-muted-foreground">{wood.length_unit}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Pieces
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setPieces(Math.max(1, pieces - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={pieces}
                onChange={(e) => setPieces(Math.max(1, Number(e.target.value) || 1))}
                className="h-12 text-center text-lg font-bold"
              />
              <Button variant="outline" size="icon" onClick={() => setPieces(pieces + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {bulkDisc > 0 && (
              <div className="mt-2 text-xs font-semibold text-success">
                ✓ Bulk discount: {bulkDisc}% off
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Price override (optional)
            </div>
            <Input placeholder={`Auto: ${formatKsh(computed)}`} value={override} onChange={(e) => setOverride(e.target.value)} />
          </div>

          <div className="rounded-xl bg-[image:var(--gradient-timber)] text-timber-foreground p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Line total</div>
              <div className="text-3xl font-bold">{formatKsh(finalTotal)}</div>
            </div>
            <TreePine className="h-12 w-12 opacity-30" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="lg"
            onClick={handleAdd}
            disabled={pieces < 1}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Add to cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
