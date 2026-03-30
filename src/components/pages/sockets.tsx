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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SocketItem {
  id: number;
  socketLabel: string;
  socketType: string;
  socketStatus: string;
  roomId: number;
  room: { id: number; roomNumber: string; block: { blockName: string } };
  powerEvents: any[];
  createdAt: string;
  updatedAt: string;
}

interface RoomOption { id: number; roomNumber: string; block: { blockName: string } }

const emptyForm = { socketLabel: '', socketType: '', socketStatus: '', roomId: 0 };

export function SocketsPage() {
  const [data, setData] = useState<SocketItem[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
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
      const [res, rRes] = await Promise.all([
        fetch('/api/sockets'),
        fetch('/api/rooms'),
      ]);
      if (!res.ok || !rRes.ok) throw new Error();
      setData(await res.json());
      setRooms(await rRes.json());
    } catch {
      toast.error('Failed to load sockets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.socketLabel || !form.socketType || !form.socketStatus || !form.roomId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/sockets/${editingId}` : '/api/sockets';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socketLabel: form.socketLabel,
          socketType: form.socketType,
          socketStatus: form.socketStatus,
          roomId: Number(form.roomId),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(editingId ? 'Socket updated' : 'Socket created');
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
      const res = await fetch(`/api/sockets/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Socket deleted');
      setDeleteOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: SocketItem) => {
    setEditingId(row.id);
    setForm({ socketLabel: row.socketLabel, socketType: row.socketType, socketStatus: row.socketStatus, roomId: row.roomId });
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const columns: ColumnDef<SocketItem>[] = [
    { accessorKey: 'socketLabel', header: 'Label' },
    { accessorKey: 'socketType', header: 'Type' },
    {
      accessorKey: 'socketStatus',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.socketStatus} />,
    },
    {
      accessorKey: 'room.roomNumber',
      header: 'Room',
      cell: ({ row }) => (
        <span>{row.original.room?.roomNumber} <span className="text-muted-foreground text-xs">({row.original.room?.block?.blockName})</span></span>
      ),
    },
    {
      accessorKey: 'powerEvents',
      header: 'Events',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.powerEvents?.length ?? 0}</span>
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
          <h1 className="text-xl font-semibold tracking-tight">Sockets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage electrical sockets and their maintenance status</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} className="mr-1.5" />Add Socket
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="socketLabel" searchPlaceholder="Search sockets..." />
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Socket' : 'Add Socket'}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="socketLabel">Socket Label</Label>
            <Input id="socketLabel" value={form.socketLabel} onChange={(e) => setForm({ ...form, socketLabel: e.target.value })} placeholder="e.g. S-101-A" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="socketType">Socket Type</Label>
            <Select value={form.socketType} onValueChange={(v) => setForm({ ...form, socketType: v })}>
              <SelectTrigger id="socketType"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Heavy Load">Heavy Load</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="socketStatus">Status</Label>
            <Select value={form.socketStatus} onValueChange={(v) => setForm({ ...form, socketStatus: v })}>
              <SelectTrigger id="socketStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roomId">Room</Label>
            <Select value={form.roomId ? String(form.roomId) : ''} onValueChange={(v) => setForm({ ...form, roomId: Number(v) })}>
              <SelectTrigger id="roomId"><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.roomNumber} ({r.block.blockName})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Socket"
        description="Are you sure? This will permanently delete this socket and all associated power events."
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
