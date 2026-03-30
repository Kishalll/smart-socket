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

interface PowerEvent {
  id: number; socketId: number; startTime: string; endTime: string;
  watts: number; eventSource: string;
  socket: { id: number; socketLabel: string; room: { roomNumber: string; block?: { blockName: string } } };
}

interface SocketOption { id: number; socketLabel: string; room: { roomNumber: string } }

const emptyForm = { socketId: 0, startTime: '', endTime: '', watts: 0, eventSource: '' };

export function PowerEventsPage() {
  const [data, setData] = useState<PowerEvent[]>([]);
  const [sockets, setSockets] = useState<SocketOption[]>([]);
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
      const [r1, r2] = await Promise.all([fetch('/api/power-events'), fetch('/api/sockets')]);
      if (!r1.ok || !r2.ok) throw new Error();
      setData(await r1.json());
      setSockets(await r2.json());
    } catch { toast.error('Failed to load power events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.socketId || !form.startTime || !form.endTime || !form.watts || !form.eventSource) {
      toast.error('Please fill in all fields'); return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/power-events/${editingId}` : '/api/power-events';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, socketId: Number(form.socketId), watts: Number(form.watts) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      toast.success(editingId ? 'Event updated' : 'Event created');
      setFormOpen(false); setForm(emptyForm); setEditingId(null); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/power-events/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success('Event deleted'); setDeleteOpen(false); setDeletingId(null); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const openEdit = (r: PowerEvent) => {
    setEditingId(r.id);
    setForm({
      socketId: r.socketId,
      startTime: new Date(r.startTime).toISOString().slice(0, 16),
      endTime: new Date(r.endTime).toISOString().slice(0, 16),
      watts: r.watts, eventSource: r.eventSource,
    });
    setFormOpen(true);
  };

  const toDT = (s: string) => {
    try { return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
  };

  const columns: ColumnDef<PowerEvent>[] = [
    {
      accessorKey: 'socket.socketLabel', header: 'Socket',
      cell: ({ row }) => <span className="font-medium">{row.original.socket?.socketLabel}</span>,
    },
    {
      id: 'room', header: 'Room',
      cell: ({ row }) => (
        <span>{row.original.socket?.room?.roomNumber}
          {row.original.socket?.room?.block && <span className="text-muted-foreground text-xs ml-1">({row.original.socket.room.block.blockName})</span>}
        </span>
      ),
    },
    { accessorKey: 'startTime', header: 'Start', cell: ({ row }) => toDT(row.original.startTime) },
    { accessorKey: 'endTime', header: 'End', cell: ({ row }) => toDT(row.original.endTime) },
    {
      id: 'watts', header: 'Watts',
      cell: ({ row }) => <span className={row.original.watts > 1500 ? 'text-red-600 font-semibold' : ''}>{row.original.watts.toLocaleString()} W</span>,
    },
    {
      id: 'duration', header: 'Duration',
      cell: ({ row }) => {
        const d = Math.round((new Date(row.original.endTime).getTime() - new Date(row.original.startTime).getTime()) / 60000);
        return <span className="text-muted-foreground">{d} min</span>;
      },
    },
    { accessorKey: 'eventSource', header: 'Source' },
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
          <h1 className="text-xl font-semibold tracking-tight">Power Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track socket usage and power consumption events</p>
        </div>
        <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setFormOpen(true); }}>
          <Plus size={15} className="mr-1.5" />Log Event
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="eventSource" searchPlaceholder="Search events..." />
      )}

      <FormDialog
        open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Power Event' : 'Log Power Event'} onSubmit={handleSubmit} loading={submitting} submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Socket</Label>
            <Select value={form.socketId ? String(form.socketId) : ''} onValueChange={(v) => setForm({ ...form, socketId: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Select socket" /></SelectTrigger>
              <SelectContent>
                {sockets.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.socketLabel} — {s.room?.roomNumber}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={form.eventSource} onValueChange={(v) => setForm({ ...form, eventSource: v })}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Sensor">Sensor</SelectItem>
                <SelectItem value="Simulated">Simulated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start Time</Label>
            <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>End Time</Label>
            <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Power Draw (Watts)</Label>
            <Input type="number" min={0} value={form.watts} onChange={(e) => setForm({ ...form, watts: Number(e.target.value) })} placeholder="e.g. 1500" />
          </div>
        </div>
      </FormDialog>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Event"
        description="Are you sure? This will permanently delete this power event and any linked violations." onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}
