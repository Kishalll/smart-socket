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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

interface Violation {
  id: number; eventId: number; ruleId: number; detectedTime: string;
  violationReason: string; caseStatus: string;
  event: { id: number; watts: number; startTime: string; endTime: string; socket: { socketLabel: string; room: { roomNumber: string; block?: { blockName: string } } } };
  rule: { id: number; ruleName: string; severityLevel: string };
  fine: { id: number; fineAmount: number; paymentStatus: string; student: { firstName: string; lastName: string; regNo: string } } | null;
}

interface EventOption { id: number; watts: number; socket: { socketLabel: string; room: { roomNumber: string } } }
interface RuleOption { id: number; ruleName: string; severityLevel: string }

const emptyForm = { eventId: 0, ruleId: 0, detectedTime: '', violationReason: '', caseStatus: 'Pending' };

const reasonOptions = [
  'Exceeded watt limit',
  'Exceeded duration limit',
  'Both watt and duration exceeded',
  'Unauthorized appliance detected',
  'Night-time heavy usage',
];

export function ViolationsPage() {
  const [data, setData] = useState<Violation[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [rules, setRules] = useState<RuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Violation | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([fetch('/api/violations'), fetch('/api/power-events'), fetch('/api/load-rules')]);
      if (!r1.ok || !r2.ok || !r3.ok) throw new Error();
      setData(await r1.json()); setEvents(await r2.json()); setRules(await r3.json());
    } catch { toast.error('Failed to load violations'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!form.eventId || !form.ruleId || !form.detectedTime || !form.violationReason) {
      toast.error('Please fill in all fields'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, eventId: Number(form.eventId), ruleId: Number(form.ruleId) }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      toast.success('Violation case created');
      setFormOpen(false); setForm(emptyForm); fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/violations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStatus: status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status updated to ${status}`);
      fetchData();
      if (detailItem?.id === id) setDetailItem({ ...detailItem, caseStatus: status });
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/violations/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Violation deleted'); setDeleteOpen(false); setDeletingId(null); fetchData();
    } catch { toast.error('Delete failed'); }
    finally { setSubmitting(false); }
  };

  const toDT = (s: string) => {
    try { return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
  };

  const columns: ColumnDef<Violation>[] = [
    {
      id: 'case', header: 'Case',
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span>,
    },
    {
      accessorKey: 'violationReason', header: 'Reason',
      cell: ({ row }) => <span className="font-medium max-w-[200px] truncate block">{row.original.violationReason}</span>,
    },
    {
      accessorKey: 'rule.ruleName', header: 'Rule',
      cell: ({ row }) => <span className="text-xs">{row.original.rule?.ruleName}</span>,
    },
    {
      id: 'location', header: 'Location',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.event?.socket?.room?.roomNumber}
          {row.original.event?.socket?.room?.block && <span className="ml-1">({row.original.event.socket.room.block.blockName})</span>}
        </span>
      ),
    },
    {
      accessorKey: 'detectedTime', header: 'Detected',
      cell: ({ row }) => <span className="text-xs">{toDT(row.original.detectedTime)}</span>,
    },
    {
      accessorKey: 'caseStatus', header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.caseStatus} />,
    },
    {
      id: 'fine', header: 'Fine',
      cell: ({ row }) => {
        const f = row.original.fine;
        if (!f) return <span className="text-xs text-muted-foreground">—</span>;
        return <span className="text-xs">₹{f.fineAmount.toLocaleString()}</span>;
      },
    },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setDetailItem(row.original); setDetailOpen(true); }}><Eye size={14} className="mr-2" />View Details</DropdownMenuItem>
            {row.original.caseStatus === 'Pending' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, 'Confirmed')}>Confirm</DropdownMenuItem>
            )}
            {row.original.caseStatus === 'Confirmed' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(row.original.id, 'Cleared')}>Clear</DropdownMenuItem>
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
          <h1 className="text-xl font-semibold tracking-tight">Violation Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and manage detected violations</p>
        </div>
        <Button size="sm" onClick={() => { setForm(emptyForm); setFormOpen(true); }}>
          <Plus size={15} className="mr-1.5" />New Case
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={data} searchKey="violationReason" searchPlaceholder="Search violations..." />
      )}

      {/* Create Form */}
      <FormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setForm(emptyForm); }}
        title="New Violation Case" onSubmit={handleSubmit} loading={submitting} submitLabel="Create">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Power Event</Label>
            <Select value={form.eventId ? String(form.eventId) : ''} onValueChange={(v) => setForm({ ...form, eventId: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.socket?.socketLabel} — {e.socket?.room?.roomNumber} ({e.watts}W)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Violated Rule</Label>
            <Select value={form.ruleId ? String(form.ruleId) : ''} onValueChange={(v) => setForm({ ...form, ruleId: Number(v) })}>
              <SelectTrigger><SelectValue placeholder="Select rule" /></SelectTrigger>
              <SelectContent>
                {rules.filter(r => r).map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.ruleName} ({r.severityLevel})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Violation Reason</Label>
            <Select value={form.violationReason} onValueChange={(v) => setForm({ ...form, violationReason: v })}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {reasonOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Detected Time</Label>
            <Input type="datetime-local" value={form.detectedTime} onChange={(e) => setForm({ ...form, detectedTime: e.target.value })} />
          </div>
        </div>
      </FormDialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base">Violation Case #{detailItem?.id}</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="shadow-none border-border/60">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Status</p>
                    <div className="mt-1"><StatusBadge status={detailItem.caseStatus} /></div>
                  </CardContent>
                </Card>
                <Card className="shadow-none border-border/60">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Severity</p>
                    <div className="mt-1"><StatusBadge status={detailItem.rule?.severityLevel || 'Low'} /></div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Reason</span><span className="font-medium">{detailItem.violationReason}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rule</span><span>{detailItem.rule?.ruleName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{detailItem.event?.socket?.room?.roomNumber} ({detailItem.event?.socket?.room?.block?.blockName})</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Socket</span><span>{detailItem.event?.socket?.socketLabel}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Power Draw</span><span className="font-semibold text-red-600">{detailItem.event?.watts?.toLocaleString()} W</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Detected</span><span>{toDT(detailItem.detectedTime)}</span></div>
              </div>
              {detailItem.fine && (
                <Card className="shadow-none border-orange-200 bg-orange-50/50">
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Associated Fine</p>
                    <div className="mt-1 text-sm space-y-1">
                      <p>Student: <strong>{detailItem.fine.student?.firstName} {detailItem.fine.student?.lastName}</strong> <span className="text-muted-foreground">({detailItem.fine.student?.regNo})</span></p>
                      <p>Amount: <strong>₹{detailItem.fine.fineAmount.toLocaleString()}</strong></p>
                      <p>Payment: <StatusBadge status={detailItem.fine.paymentStatus} /></p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="flex gap-2">
                {detailItem.caseStatus === 'Pending' && (
                  <Button size="sm" variant="outline" onClick={() => { handleStatusUpdate(detailItem.id, 'Confirmed'); setDetailOpen(false); }}>Mark Confirmed</Button>
                )}
                {detailItem.caseStatus === 'Confirmed' && (
                  <Button size="sm" variant="outline" onClick={() => { handleStatusUpdate(detailItem.id, 'Cleared'); setDetailOpen(false); }}>Mark Cleared</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Violation"
        description="Are you sure? This will permanently delete this violation case and any linked fine." onConfirm={handleDelete} loading={submitting} />
    </div>
  );
}
