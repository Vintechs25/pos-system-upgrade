import { FileText, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBranchSelection, useQuotations, deleteQuotation, formatKsh } from "@/lib/cloud-store";
import { toast } from "sonner";

export function QuotationsPage() {
  const { activeBranchId } = useBranchSelection();
  const { items, loading, reload } = useQuotations(activeBranchId);

  async function remove(id: string) {
    if (!confirm("Delete this quote?")) return;
    try { await deleteQuotation(id); toast.success("Quote deleted"); reload(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" /> Quotations
        </h1>
        <p className="text-sm text-muted-foreground">{items.length} quotes</p>
      </header>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No quotes yet. Create one from POS → Quote.</TableCell></TableRow>}
            {items.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.quote_no}</TableCell>
                <TableCell>{q.customer_name ?? "Walk-in"}</TableCell>
                <TableCell className="capitalize">{q.status}</TableCell>
                <TableCell>{q.valid_until ?? "-"}</TableCell>
                <TableCell className="text-right font-semibold">{formatKsh(Number(q.total))}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => remove(q.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
