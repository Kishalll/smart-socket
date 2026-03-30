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

interface Student {
  id: number;
  regNo: string;
  firstName: string;
  lastName: string;
  department: string;
  yearOfStudy: number;
  phoneNo: string;
  roomId: number | null;
  room: { id: number; roomNumber: string; block: { blockName: string } } | null;
  fines: any[];
  createdAt: string;
  updatedAt: string;
}

interface RoomOption { id: number; roomNumber: string; block: { blockName: string } }

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'BME'];
const emptyForm = { regNo: '', firstName: '', lastName: '', department: '', yearOfStudy: 1, phoneNo: '', roomId: '' };

export function StudentsPage() {
  const [data, setData] = useState<Student[]>([]);
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
        fetch('/api/students'),
        fetch('/api/rooms'),
      ]);
      if (!res.ok || !rRes.ok) throw new Error();
      setData(await res.json());
      setRooms(await rRes.json());
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.regNo || !form.firstName || !form.lastName || !form.department || !form.phoneNo) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/students/${editingId}` : '/api/students';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regNo: form.regNo,
          firstName: form.firstName,
          lastName: form.lastName,
          department: form.department,
          yearOfStudy: Number(form.yearOfStudy),
          phoneNo: form.phoneNo,
          ...(form.roomId ? { roomId: Number(form.roomId) } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(editingId ? 'Student updated' : 'Student created');
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
      const res = await fetch(`/api/students/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success('Student deleted');
      setDeleteOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: Student) => {
    setEditingId(row.id);
    setForm({
      regNo: row.regNo,
      firstName: row.firstName,
      lastName: row.lastName,
      department: row.department,
      yearOfStudy: row.yearOfStudy,
      phoneNo: row.phoneNo,
      roomId: row.roomId ? String(row.roomId) : '',
    });
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const columns: ColumnDef<Student>[] = [
    { accessorKey: 'regNo', header: 'Reg No' },
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <span>{row.original.firstName} {row.original.lastName}</span>
      ),
    },
    { accessorKey: 'department', header: 'Dept.' },
    {
      accessorKey: 'yearOfStudy',
      header: 'Year',
      cell: ({ row }) => <span>{row.original.yearOfStudy}</span>,
    },
    {
      accessorKey: 'room.roomNumber',
      header: 'Room',
      cell: ({ row }) => {
        const r = row.original.room;
        return r ? (
          <span>{r.roomNumber}{r.block ? <span className="text-muted-foreground text-xs"> ({r.block.blockName})</span> : null}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
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
          <h1 className="text-xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage student records and room allocations</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} className="mr-1.5" />Add Student
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="regNo" searchPlaceholder="Search by reg no..." />
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}
        title={editingId ? 'Edit Student' : 'Add Student'}
        onSubmit={handleSubmit}
        loading={submitting}
        submitLabel={editingId ? 'Update' : 'Create'}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="regNo">Registration No.</Label>
            <Input id="regNo" value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} placeholder="e.g. 2024CSE001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger id="department"><SelectValue placeholder="Select dept." /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearOfStudy">Year of Study</Label>
            <Select value={String(form.yearOfStudy)} onValueChange={(v) => setForm({ ...form, yearOfStudy: Number(v) })}>
              <SelectTrigger id="yearOfStudy"><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNo">Phone No.</Label>
            <Input id="phoneNo" value={form.phoneNo} onChange={(e) => setForm({ ...form, phoneNo: e.target.value })} placeholder="e.g. 9876543210" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roomId">Room (Optional)</Label>
            <Select value={form.roomId} onValueChange={(v) => setForm({ ...form, roomId: v === '__none__' ? '' : v })}>
              <SelectTrigger id="roomId"><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No Room</SelectItem>
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
        title="Delete Student"
        description="Are you sure? This will permanently delete this student record and all associated fines."
        onConfirm={handleDelete}
        loading={submitting}
      />
    </div>
  );
}
