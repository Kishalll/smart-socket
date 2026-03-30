'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { FormDialog, DeleteDialog } from '@/components/shared/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LoadRule {
  id: number; ruleName: string; maxWatts: number; maxDurationMinutes: number;
  severityLevel: string; isActive: boolean; violations: any[];
}

const emptyForm = { ruleName: '', maxWatts: 0, maxDurationMinutes: 0, severityLevel: '', isActive: true };

export function LoadRulesPage() {
  const [data, setData] = useState<LoadRule[]>([]);
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
      const res = await fetch('/api/load-rules');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch { toast.error('Failed to load rules'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.ruleName || !form.maxWatts || !form.maxDurationMinutes || !form.severityLevel) {
      toast.error('Please fill in all fields'); return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/load-rules/${editingId}` : '/api/load-rules';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxWatts: Number(form.maxWatts), maxDurationMinutes: Number(form.maxDurationMinutes) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      toast.success(editingId ? 'Rule updated' : 'Rule created');
      setFormOpen(false); setForm(emptyForm); setEditingId(null); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/load-rules/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Rule deleted'); setDeleteOpen(false); setDeletingId(null); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const openEdit = (r: LoadRule) => {
    setEditingId(r.id);
    setForm({ ruleName: r.ruleName, maxWatts: r.maxWatts, maxDurationMinutes: r.maxDurationMinutes, severityLevel: r.severityLevel, isActive: r.isActive });
    setFormOpen(true);
  };

  const columns: ColumnDef<LoadRule>[] = [
    { accessorKey: 'ruleName', header: 'Rule Name', cell: ({ row }) => <span className="font-medium">{row.original.ruleName}</span> },
    { accessorKey: 'maxWatts', header: 'Max Watts', cell: ({ row }) => `${row.original.maxWatts.toLocaleString()} W` },
    { accessorKey: 'maxDurationMinutes', header: 'Max Duration', cell: ({ row }) => `${row.original.maxDurationMinutes} min` },
    {
      accessorKey: 'severityLevel', header: 'Severity',
      cell: ({ row }) => <StatusBadge status={row.original.severityLevel} />,
    },
    {
      accessorKey: 'isActive', header: 'Active',
      cell: ({ row }) => <StatusBadge status={String(row.original.isActive)} />,
    },
    {
      accessorKey: 'violations', header: 'Violations',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.violations?.length ?? 0}</span>,
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
          <h1 className="text-xl font-semibold tracking-tight">Load Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define power usage thresholds and violation rules</p>
        </div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setFormOpen(true); }}>
          <Plus size={15} className="mr-1.5" />Add Rule
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="ruleName" searchPlaceholder="Search rules..." />
      )}

      <FormDialog
        open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Rule' : 'Add Rule'} onSubmit={handleSubmit} loading={submitting} submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rule Name</Label>
            <Input value={form.ruleName} onChange={(e) => setForm({ ...form, ruleName: e.target.value })} placeholder="e.g. High Watt Threshold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Watts</Label>
              <Input type="number" min={0} value={form.maxWatts} onChange={(e) => setForm({ ...form, maxWatts: Number(e.target.value) })} placeholder="e.g. 1500" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Duration (min)</Label>
              <Input type="number" min={0} value={form.maxDurationMinutes} onChange={(e) => setForm({ ...form, maxDurationMinutes: Number(e.target.value) })} placeholder="e.g. 20" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Severity Level</Label>
            <Select value={form.severityLevel} onValueChange={(v) => setForm({ ...form, severityLevel: v })}>
              <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            <Label>Rule is active</Label>
          </div>
        </div>
      </FormDialog>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Rule"
        description="Are you sure? This will permanently delete this rule. Existing violation cases linked to it will be affected." onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}
