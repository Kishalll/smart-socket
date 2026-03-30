'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { FormDialog, DeleteDialog } from '@/components/shared/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface HostelBlock {
  id: number;
  blockName: string;
  genderType: string;
  totalFloors: number;
  rooms: any[];
  wardens: any[];
  createdAt: string;
  updatedAt: string;
}

const emptyForm = { blockName: '', genderType: '', totalFloors: 0 };

export function HostelBlocksPage() {
  const [data, setData] = useState<HostelBlock[]>([]);
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
      const res = await fetch('/api/hostel-blocks');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error('Failed to load hostel blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.blockName || !form.genderType || !form.totalFloors) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/hostel-blocks/${editingId}` : '/api/hostel-blocks';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalFloors: Number(form.totalFloors) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(editingId ? 'Block updated' : 'Block created');
      setFormOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hostel-blocks/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Block deleted');
      setDeleteOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: HostelBlock) => {
    setEditingId(row.id);
    setForm({ blockName: row.blockName, genderType: row.genderType, totalFloors: row.totalFloors });
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const columns: ColumnDef<HostelBlock>[] = [
    { accessorKey: 'blockName', header: 'Block Name' },
    {
      accessorKey: 'genderType',
      header: 'Gender',
      cell: ({ row }) => <StatusBadge status={row.original.genderType} />,
    },
    { accessorKey: 'totalFloors', header: 'Floors' },
    {
      accessorKey: 'rooms',
      header: 'Rooms',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.rooms?.length ?? 0}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(row.original)}>
              <Pencil size={14} className="mr-2" />Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => { setDeletingId(row.original.id); setDeleteOpen(true); }}
            >
              <Trash2 size={14} className="mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Hostel Blocks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage hostel buildings and their configuration</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} className="mr-1.5" />Add Block
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="blockName" searchPlaceholder="Search blocks..." />
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Block' : 'Add Block'}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="blockName">Block Name</Label>
            <Input id="blockName" value={form.blockName} onChange={(e) => setForm({ ...form, blockName: e.target.value })} placeholder="e.g. Block A" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="genderType">Gender Type</Label>
            <Select value={form.genderType} onValueChange={(v) => setForm({ ...form, genderType: v })}>
              <SelectTrigger id="genderType"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Boys">Boys</SelectItem>
                <SelectItem value="Girls">Girls</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="totalFloors">Total Floors</Label>
            <Input id="totalFloors" type="number" min={1} value={form.totalFloors} onChange={(e) => setForm({ ...form, totalFloors: Number(e.target.value) })} />
          </div>
        </div>
      </FormDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Block"
        description="Are you sure? This will permanently delete this block and all associated rooms, students, sockets, and events."
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
