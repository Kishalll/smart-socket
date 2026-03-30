'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2, DoorOpen, Users, Plug, Zap, AlertTriangle, Clock, IndianRupee,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

interface ApiStats {
  counts: { blocks: number; rooms: number; students: number; sockets: number; events: number; violations: number; fines: number };
  pendingViolations: number;
  unpaidFinesTotal: number;
  recentViolations: any[];
  violationsByBlock: { blockName: string; count: number }[];
  powerUsageByDay: { date: string; energyWh: number }[];
  topStudentsViolations: { studentName: string; regNo: string; violationCount: number }[];
  fineCollection: { paid: { count: number; totalAmount: number }; unpaid: { count: number; totalAmount: number } };
}

const PIE_COLORS = ['#f97316', '#22c55e', '#94a3b8'];
const BAR_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export function DashboardPage() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats || !stats.counts) return <p className="text-sm text-muted-foreground">Failed to load dashboard data.</p>;

  const c = stats.counts;

  const cards = [
    { label: 'Hostel Blocks', value: c.blocks, icon: <Building2 size={18} />, accent: 'text-orange-600 bg-orange-50' },
    { label: 'Rooms', value: c.rooms, icon: <DoorOpen size={18} />, accent: 'text-amber-600 bg-amber-50' },
    { label: 'Students', value: c.students, icon: <Users size={18} />, accent: 'text-teal-600 bg-teal-50' },
    { label: 'Sockets', value: c.sockets, icon: <Plug size={18} />, accent: 'text-cyan-600 bg-cyan-50' },
    { label: 'Power Events', value: c.events, icon: <Zap size={18} />, accent: 'text-yellow-600 bg-yellow-50' },
    { label: 'Violations', value: c.violations, icon: <AlertTriangle size={18} />, accent: 'text-red-600 bg-red-50' },
    { label: 'Pending Reviews', value: stats.pendingViolations, icon: <Clock size={18} />, accent: 'text-amber-600 bg-amber-50' },
    { label: 'Unpaid Fines', value: `₹${(stats.unpaidFinesTotal || 0).toLocaleString()}`, icon: <IndianRupee size={18} />, accent: 'text-rose-600 bg-rose-50' },
  ];

  // Transform fine collection into array for pie chart
  const finePieData = [
    { status: 'Paid', amount: stats.fineCollection?.paid?.totalAmount || 0 },
    { status: 'Pending', amount: stats.fineCollection?.unpaid?.totalAmount || 0 },
  ];

  const tipStyle = { fontSize: 12, borderRadius: 8, border: '1px solid oklch(0.91 0.005 90)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of hostel monitoring system</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(s => (
          <Card key={s.label} className="border-border/60 shadow-none hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-semibold tracking-tight mt-1">{s.value}</p>
                </div>
                <div className={cn('p-2 rounded-lg', s.accent)}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-none">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Violations by Block</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.violationsByBlock}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.91 0.005 90)" />
                  <XAxis dataKey="blockName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={tipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(stats.violationsByBlock || []).map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Power Usage (7 Days)</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.powerUsageByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.91 0.005 90)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={tipStyle} />
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="energyWh" stroke="#f97316" fill="url(#wg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Fine Collection</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={finePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="amount" nameKey="status">
                    {finePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <RTooltip contentStyle={tipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {finePieData.map((item, i) => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{item.status}</span>
                  <span className="font-medium">₹{(item.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recent Violations</h3>
              <span className="text-[11px] text-muted-foreground">{(stats.recentViolations || []).length} latest</span>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {(stats.recentViolations || []).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                      <AlertTriangle size={14} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.violationReason}</p>
                      <p className="text-[11px] text-muted-foreground">{v.rule?.ruleName}</p>
                    </div>
                  </div>
                  <StatusBadge status={v.caseStatus} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Top Offenders</h3>
              <span className="text-[11px] text-muted-foreground">Most violations</span>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {(stats.topStudentsViolations || []).map((s, i) => (
                <div key={s.regNo} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    i === 0 ? 'bg-red-100 text-red-700' : i === 1 ? 'bg-amber-100 text-amber-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                  )}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.studentName}</p>
                    <p className="text-[11px] text-muted-foreground">{s.regNo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-red-600">{s.violationCount}</p>
                    <p className="text-[10px] text-muted-foreground">violation{s.violationCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
