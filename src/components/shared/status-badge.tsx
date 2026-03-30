import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  // Violation statuses
  Pending: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  Confirmed: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  Cleared: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  // Payment statuses
  Paid: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  Unpaid: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  Overdue: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  // Socket statuses
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  'Under Maintenance': 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
  // Severity
  High: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  Low: 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100',
  // Gender
  Boys: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  Girls: 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-100',
  // Rule active
  true: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  false: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium px-2 py-0.5 rounded-md leading-relaxed border',
        statusStyles[status] || 'bg-muted text-muted-foreground border-border hover:bg-muted',
        className
      )}
    >
      {status}
    </Badge>
  );
}
