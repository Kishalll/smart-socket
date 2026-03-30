'use client';

import { useEffect, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { FormDialog, DeleteDialog } from '@/components/shared/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Fine {
  id: number; caseId: number; studentId: number; wardenId: number;
  fineAmount: number; issuedDate: string; dueDate: string; paymentStatus: string;
  case: { id: number; violationReason: string; event: { socket: { room: { roomNumber: string; block?: { blockName: string } } } } };
  student: { id: number; regNo: string; firstName: string; lastName: string; department: string };
  warden: { id: number; firstName: string; lastName: string };
}

interface ViolationOption { id: number; violationReason: string; caseStatus: string; event: { socket: { room: { roomNumber: string } } } }
interface StudentOption { id: number; regNo: string; firstName: string; lastName: string }
interface WardenOption { id: number; firstName: string; lastName: string }

const emptyForm = { caseId: 0, studentId: 0, wardenId: 0, fineAmount: 0, issuedDate: '', dueDate: '', paymentStatus: 'Pending' };

export function FinesPage() {
  const [data, setData] = useState<Fine[]>([]);
  const [violations, setViolations] = useState<ViolationOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [wardens, setWardens] = useState<WardenOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Fine | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch('/api/fines'), fetch('/api/violations'), fetch('/api/students'), fetch('/api/wardens'),
      ]);
      if (!r1.ok || !r2.ok || !r3.ok || !r4.ok) throw new Error();
      setData(await r1.json());
      setViolations((await r2.json()).filter((v: any) => v.caseStatus === 'Confirmed' && !v.fine));
      setStudents(await r3.json());
      setWardens(await r4.json());
    } catch { toast.error('Failed to load fines'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.caseId || !form.studentId || !form.wardenId || !form.fineAmount || !form.issuedDate || !form.dueDate) {
      toast.error('Please fill in all fields'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          caseId: Number(form.caseId),
          studentId: Number(form.studentId),
          wardenId: Number(form.wardenId),
          fineAmount: Number(form.fineAmount),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      toast.success('Fine issued');
      setFormOpen(false); setForm(emptyForm); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/fines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Payment status updated to ${status}`);
      fetchData();
      if (detailItem?.id === id) setDetailItem({ ...detailItem, paymentStatus: status });
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/fines/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Fine deleted'); setDeleteOpen(false); setDeletingId(null); fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setSubmitting(false); }
  };

  const toD = (s: string) => {
    try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return s; }
  };

  const isOverdue = (d: string, s: string) => s !== 'Paid' && new Date(d) < new Date();

  const columns: ColumnDef<Fine>[] = [
    { id: 'fine', header: 'Fine #', cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span> },
    {
      id: 'student', header: 'Student',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.student?.firstName} {row.original.student?.lastName}</span>
          <p className="text-[11px] text-muted-foreground">{row.original.student?.regNo}</p>
        </div>
      ),
    },
    {
      id: 'violation', header: 'Violation',
      cell: ({ row }) => (
        <span className="text-xs max-w-[180px] truncate block">{row.original.case?.violationReason}</span>
      ),
    },
    {
      id: 'location', header: 'Room',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.case?.event?.socket?.room?.roomNumber}
          {row.original.case?.event?.socket?.room?.block && <span className="ml-1">({row.original.case.event.socket.room.block.blockName})</span>}
        </span>
      ),
    },
    {
      accessorKey: 'fineAmount', header: 'Amount',
      cell: ({ row }) => <span className="font-semibold">₹{row.original.fineAmount.toLocaleString()}</span>,
    },
    { accessorKey: 'issuedDate', header: 'Issued', cell: ({ row }) => <span className="text-xs">{toD(row.original.issuedDate)}</span> },
    {
      accessorKey: 'dueDate', header: 'Due',
      cell: ({ row }) => (
        <span className={`text-xs ${isOverdue(row.original.dueDate, row.original.paymentStatus) ? 'text-red-600 font-medium' : ''}`}>
          {toD(row.original.dueDate)}
        </span>
      ),
    },
    {
      accessorKey: 'paymentStatus', header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setDetailItem(row.original); setDetailOpen(true); }}><Eye size={14} className="mr-2" />Details</DropdownMenuItem>
            {row.original.paymentStatus === 'Pending' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, 'Paid')}>Mark Paid</DropdownMenuItem>
            )}
            {row.original.paymentStatus === 'Pending' && isOverdue(row.original.dueDate, row.original.paymentStatus) && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, 'Overdue')}>Mark Overdue</DropdownMenuItem>
            )}
            {row.original.paymentStatus === 'Overdue' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, 'Paid')}>Mark Paid</DropdownMenuItem>
            )}
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
          <h1 className="text-xl font-semibold tracking-tight">Fines</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Issue and track fines for confirmed violations</p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setFormOpen(true); }}>
          <Plus size={15} className="mr-1.5" />Issue Fine
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="student" searchPlaceholder="Search by reg no..." />
      )}

      <FormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setForm(emptyForm); }}
        title="Issue Fine" onSubmit={handleSubmit} loading={submitting} submitLabel="Issue">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Violation Case</Label>
            <Select value={form.caseId ? String(form.caseId) : ''} onValueChange={(v) => setForm({ ...form, caseId: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Select confirmed violation" /></SelectTrigger>
              <SelectContent>
                {violations.length === 0 && <SelectItem value="none" disabled>No confirmed violations without fines</SelectItem>}
                {violations.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    #{v.id} — {v.violationReason} ({v.event?.socket?.room?.roomNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={form.studentId ? String(form.studentId) : ''} onValueChange={(v) => setForm({ ...form, studentId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.regNo} — {s.firstName} {s.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Issuing Warden</Label>
              <Select value={form.wardenId ? String(form.wardenId) : ''} onValueChange={(v) => setForm({ ...form, wardenId: Number(v) })}>
                <SelectTrigger><SelectValue placeholder="Select warden" /></SelectTrigger>
                <SelectContent>
                  {wardens.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.firstName} {w.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Fine Amount (₹)</Label>
            <Input type="number" min={0} value={form.fineAmount} onChange={(e) => setForm({ ...form, fineAmount: Number(e.target.value) })} placeholder="e.g. 500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issued Date</Label>
              <Input type="date" value={form.issuedDate} onChange={(e) => setForm({ ...form, issuedDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base">Fine #{detailItem?.id}</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <Card className={`shadow-none border-border/60 ${isOverdue(detailItem.dueDate, detailItem.paymentStatus) ? 'border-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Payment Status</p>
                    <StatusBadge status={detailItem.paymentStatus} />
                  </div>
                  <p className="text-2xl font-bold mt-2">₹{detailItem.fineAmount.toLocaleString()}</p>
                </CardContent>
              </Card>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium">{detailItem.student?.firstName} {detailItem.student?.lastName} ({detailItem.student?.regNo})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Violation</span><span>{detailItem.case?.violationReason}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span>{detailItem.case?.event?.socket?.room?.roomNumber}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issued By</span><span>{detailItem.warden?.firstName} {detailItem.warden?.lastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Issued</span><span>{toD(detailItem.issuedDate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className={isOverdue(detailItem.dueDate, detailItem.paymentStatus) ? 'text-red-600 font-medium' : ''}>{toD(detailItem.dueDate)}</span></div>
              </div>
              {detailItem.paymentStatus !== 'Paid' && (
                <Button size="sm" className="w-full" onClick={() => { handleStatusUpdate(detailItem.id, 'Paid'); setDetailOpen(false); }}>
                  Mark as Paid
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Fine"
        description="Are you sure? This will permanently delete this fine record." onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}
