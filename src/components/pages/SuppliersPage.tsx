import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  useSuppliers,
  upsertSupplier,
  deleteSupplier,
  type CloudSupplier,
} from "@/lib/cloud-store";
import { toast } from "sonner";

const blank = {
  id: undefined as string | undefined,
  name: "",
  phone: "",
  contact_person: "",
  email: "",
  notes: "",
};

export function SuppliersPage() {
  const { activeBusinessId } = useAuth();
  const { items, loading, reload } = useSuppliers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState("");

  function startNew() {
    setForm(blank);
    setOpen(true);
  }

  function startEdit(s: CloudSupplier) {
    setForm({
      id: s.id,
      name: s.name,
      phone: s.phone ?? "",
      contact_person: s.contact_person ?? "",
      email: s.email ?? "",
      notes: s.notes ?? "",
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
      await upsertSupplier({
        id: form.id,
        business_id: activeBusinessId,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        contact_person: form.contact_person.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Supplier updated" : "Supplier added");
      setOpen(false);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(s: CloudSupplier) {
    if (!confirm(`Delete supplier "${s.name}"?`)) return;
    try {
      await deleteSupplier(s.id);
      toast.success("Supplier removed");
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const filtered = items.filter((s) =>
    !search.trim() ? true : s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6" /> Suppliers
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your hardware and timber suppliers.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-1" /> Add supplier
        </Button>
      </header>

      <Input
        placeholder="Search suppliers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No suppliers yet.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.contact_person ?? "-"}</TableCell>
                <TableCell>{s.phone ?? "-"}</TableCell>
                <TableCell>{s.email ?? "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(s)}>
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
            <DialogTitle>{form.id ? "Edit supplier" : "Add supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Contact person</label>
                <Input
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Email</label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
