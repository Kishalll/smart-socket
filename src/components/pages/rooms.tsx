'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { FormDialog, DeleteDialog } from '@/components/shared/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Room {
  id: number;
  roomNumber: string;
  floorNo: number;
  roomType: string;
  capacity: number;
  blockId: number;
  block: { id: number; blockName: string; genderType: string };
  students: any[];
  sockets: any[];
  createdAt: string;
  updatedAt: string;
}

interface BlockOption { id: number; blockName: string; genderType: string }

const emptyForm = { roomNumber: '', floorNo: 0, roomType: '', capacity: 0, blockId: 0 };

export function RoomsPage() {
  const [data, setData] = useState<Room[]>([]);
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
      const [res, bRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/hostel-blocks'),
      ]);
      if (!res.ok || !bRes.ok) throw new Error();
      setData(await res.json());
      setBlocks(await bRes.json());
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.roomNumber || !form.roomType || !form.capacity || !form.blockId) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/rooms/${editingId}` : '/api/rooms';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: form.roomNumber,
          floorNo: Number(form.floorNo),
          roomType: form.roomType,
          capacity: Number(form.capacity),
          blockId: Number(form.blockId),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(editingId ? 'Room updated' : 'Room created');
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
      const res = await fetch(`/api/rooms/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Room deleted');
      setDeleteOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: Room) => {
    setEditingId(row.id);
    setForm({ roomNumber: row.roomNumber, floorNo: row.floorNo, roomType: row.roomType, capacity: row.capacity, blockId: row.blockId });
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const columns: ColumnDef<Room>[] = [
    { accessorKey: 'roomNumber', header: 'Room No.' },
    { accessorKey: 'floorNo', header: 'Floor' },
    { accessorKey: 'roomType', header: 'Type' },
    { accessorKey: 'capacity', header: 'Capacity' },
    {
      accessorKey: 'block.blockName',
      header: 'Block',
      cell: ({ row }) => (
        <span>{row.original.block?.blockName} <span className="text-muted-foreground text-xs">({row.original.block?.genderType})</span></span>
      ),
    },
    {
      accessorKey: 'students',
      header: 'Students',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.students?.length ?? 0}</span>
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
          <h1 className="text-xl font-semibold tracking-tight">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage hostel rooms and their allocation details</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} className="mr-1.5" />Add Room
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="roomNumber" searchPlaceholder="Search rooms..." />
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Room' : 'Add Room'}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="roomNumber">Room Number</Label>
            <Input id="roomNumber" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="floorNo">Floor No.</Label>
            <Input id="floorNo" type="number" min={0} value={form.floorNo} onChange={(e) => setForm({ ...form, floorNo: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={form.roomType} onValueChange={(v) => setForm({ ...form, roomType: v })}>
              <SelectTrigger id="roomType"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Double">Double</SelectItem>
                <SelectItem value="Triple">Triple</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="blockId">Block</Label>
            <Select value={form.blockId ? String(form.blockId) : ''} onValueChange={(v) => setForm({ ...form, blockId: Number(v) })}>
              <SelectTrigger id="blockId"><SelectValue placeholder="Select block" /></SelectTrigger>
              <SelectContent>
                {blocks.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.blockName} ({b.genderType})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Room"
        description="Are you sure? This will permanently delete this room and all associated students and sockets."
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
