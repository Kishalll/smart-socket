'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { FormDialog, DeleteDialog } from '@/components/shared/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Warden {
  id: number; firstName: string; lastName: string; phoneNo: string; email: string;
  blockId: number; block: { id: number; blockName: string; genderType: string };
  fines: any[];
}

interface BlockOption { id: number; blockName: string; genderType: string }

const emptyForm = { firstName: '', lastName: '', phoneNo: '', email: '', blockId: 0 };

export function WardensPage() {
  const [data, setData] = useState<Warden[]>([]);
  const [blocks, setBlocks] = useState<BlockOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([fetch('/api/wardens'), fetch('/api/hostel-blocks')]);
      if (!r1.ok || !r2.ok) throw new Error();
      setData(await r1.json()); setBlocks(await r2.json());
    } catch { toast.error('Failed to load wardens'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.blockId) {
      toast.error('Please fill in all required fields'); return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/wardens/${editingId}` : '/api/wardens';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, blockId: Number(form.blockId) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      toast.success(editingId ? 'Warden updated' : 'Warden created');
      setFormOpen(false); setForm(emptyForm); setEditingId(null); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/wardens/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Warden deleted'); setDeleteOpen(false); setDeletingId(null); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const openEdit = (r: Warden) => {
    setEditingId(r.id);
    setForm({ firstName: r.firstName, lastName: r.lastName, phoneNo: r.phoneNo, email: r.email, blockId: r.blockId });
    setFormOpen(true);
  };

  const columns: ColumnDef<Warden>[] = [
    {
      id: 'name', header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.firstName} {row.original.lastName}</span>,
    },
    {
      id: 'contact', header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail size={11} />{row.original.email}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone size={11} />{row.original.phoneNo}</span>
        </div>
      ),
    },
    {
      accessorKey: 'block.blockName', header: 'Block',
      cell: ({ row }) => (
        <span>{row.original.block?.blockName} <span className="text-muted-foreground text-xs">({row.original.block?.genderType})</span></span>
      ),
    },
    {
      accessorKey: 'fines', header: 'Fines Issued',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.fines?.length ?? 0}</span>,
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil size={14} className="mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => { setDeletingId(row.original.id); setDeleteOpen(true); }}><Trash2 size={14} className="mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Wardens</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage hostel wardens and their assigned blocks</p>
        </div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setFormOpen(true); }}>
          <Plus size={15} className="mr-1.5" />Add Warden
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="name" searchPlaceholder="Search wardens..." />
      )}

      <FormDialog
        open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Warden' : 'Add Warden'} onSubmit={handleSubmit} loading={submitting} submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phoneNo} onChange={(e) => setForm({ ...form, phoneNo: e.target.value })} placeholder="e.g. 9876543210" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="warden@hostel.edu" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Assigned Block</Label>
            <Select value={form.blockId ? String(form.blockId) : ''} onValueChange={(v) => setForm({ ...form, blockId: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Select block" /></SelectTrigger>
              <SelectContent>
                {blocks.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.blockName} ({b.genderType})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Warden"
        description="Are you sure? This will permanently delete this warden." onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}
