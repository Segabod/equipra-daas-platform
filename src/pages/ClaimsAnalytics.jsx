import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Clock, FileText, AlertCircle } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const INCIDENT_TYPES = [
  { value: 'accidental_damage', label: 'Accidental Damage' },
  { value: 'liquid_damage', label: 'Liquid Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'loss', label: 'Loss' },
  { value: 'fire', label: 'Fire Damage' },
  { value: 'power_surge', label: 'Power Surge' },
  { value: 'screen_crack', label: 'Screen Crack' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#6B7280' },
  submitted: { label: 'Submitted', color: '#2563EB' },
  under_review: { label: 'Under Review', color: '#D97706' },
  pending_manager_approval: { label: 'Pending Mgr Approval', color: '#7C3AED' },
  approved: { label: 'Approved', color: '#059669' },
  rejected: { label: 'Rejected', color: '#DC2626' },
  paid: { label: 'Paid', color: '#10B981' },
  withdrawn: { label: 'Withdrawn', color: '#6B7280' },
};

const COLORS = ['#0FA3B1', '#0B1F3A', '#D4AF37', '#059669', '#DC2626', '#D97706', '#7C3AED', '#2563EB'];

export default function ClaimsAnalytics() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.InsuranceClaim.list('-created_date', 500).then(c => {
      setClaims(c);
      setLoading(false);
    });
  }, []);

  // ── Calculate metrics ──
  const totalClaims = claims.length;
  const claimsByStatus = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map(status => [
      status,
      claims.filter(c => c.status === status).length,
    ])
  );

  const claimsByIncident = Object.fromEntries(
    INCIDENT_TYPES.map(it => [
      it.value,
      claims.filter(c => c.incident_type === it.value).length,
    ])
  );

  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const rejectedClaims = claims.filter(c => c.status === 'rejected').length;
  const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : 0;

  // ── Average processing time (from submitted to approved/rejected/paid) ──
  const completedClaims = claims.filter(c =>
    ['approved', 'rejected', 'paid', 'withdrawn'].includes(c.status) &&
    c.created_date &&
    c.resolved_date
  );
  const avgProcessingDays = completedClaims.length > 0
    ? (completedClaims.reduce((sum, c) => {
        const created = new Date(c.created_date);
        const resolved = new Date(c.resolved_date);
        return sum + Math.ceil((resolved - created) / (1000 * 60 * 60 * 24));
      }, 0) / completedClaims.length).toFixed(1)
    : 'N/A';

  // ── Claims timeline (by month) ──
  const monthlyData = {};
  claims.forEach(c => {
    if (c.created_date) {
      const date = new Date(c.created_date);
      const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlyData[key] = (monthlyData[key] || 0) + 1;
    }
  });
  const timelineData = Object.entries(monthlyData).map(([month, count]) => ({ month, claims: count }));

  // ── Status distribution data ──
  const statusData = Object.entries(claimsByStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
      color: STATUS_CONFIG[status]?.color,
    }));

  // ── Incident type distribution data ──
  const incidentData = INCIDENT_TYPES.filter(it => claimsByIncident[it.value] > 0).map((it, i) => ({
    name: it.label,
    value: claimsByIncident[it.value],
    color: COLORS[i % COLORS.length],
  }));

  const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: P.text }}>{label}</p>
          <p className="text-3xl font-bold mt-2" style={{ color: P.navy }}>{value}</p>
          {subtext && <p className="text-xs mt-1" style={{ color: P.text }}>{subtext}</p>}
        </div>
        <Icon className="w-10 h-10" style={{ color, opacity: 0.3 }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: P.navy }}>Claims Analytics</h1>
            <p className="text-sm mt-1" style={{ color: P.text }}>Comprehensive insights into your insurance claim pipeline</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16" style={{ color: P.text }}>Loading analytics...</div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FileText} label="Total Claims" value={totalClaims} color={P.teal} />
              <StatCard icon={TrendingUp} label="Approval Rate" value={`${approvalRate}%`} subtext={`${approvedClaims} approved, ${rejectedClaims} rejected`} color="#059669" />
              <StatCard icon={Calendar} label="Avg. Processing Time" value={avgProcessingDays !== 'N/A' ? `${avgProcessingDays} days` : 'N/A'} subtext="From submission to resolution" color={P.gold} />
              <StatCard icon={AlertCircle} label="Pending Review" value={claimsByStatus.under_review + claimsByStatus.pending_manager_approval} subtext="Currently in pipeline" color="#D97706" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Claims Timeline */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Claims Filed Over Time</h2>
                {timelineData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center" style={{ color: P.text }}>No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                      <XAxis dataKey="month" stroke={P.text} style={{ fontSize: 12 }} />
                      <YAxis stroke={P.text} style={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: `1px solid ${P.border}`, borderRadius: 8 }}
                        cursor={{ stroke: P.teal, strokeWidth: 1 }}
                      />
                      <Line type="monotone" dataKey="claims" stroke={P.teal} dot={{ fill: P.teal, r: 4 }} activeDot={{ r: 6 }} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Claims by Status</h2>
                {statusData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center" style={{ color: P.text }}>No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusData} margin={{ top: 5, right: 30, left: 0, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke={P.text} style={{ fontSize: 11 }} />
                      <YAxis stroke={P.text} style={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: `1px solid ${P.border}`, borderRadius: 8 }} />
                      <Bar dataKey="value" fill={P.teal} radius={[8, 8, 0, 0]}>
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incident Type Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Distribution of Incident Types</h2>
                {incidentData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center" style={{ color: P.text }}>No data available</div>
                ) : (
                  <div className="flex flex-col">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <Pie
                          data={incidentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {incidentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'white', border: `1px solid ${P.border}`, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-1">
                      {incidentData.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span style={{ color: P.text }}>{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4" style={{ color: P.navy }}>Status Breakdown</h2>
                <div className="space-y-3">
                  {Object.entries(claimsByStatus).map(([status, count]) => {
                    if (count === 0) return null;
                    const config = STATUS_CONFIG[status];
                    const percentage = ((count / totalClaims) * 100).toFixed(1);
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: P.navy, fontSize: 14, fontWeight: 500 }}>{config.label}</span>
                          <span style={{ color: config.color, fontWeight: 600 }}>{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ backgroundColor: config.color, width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm font-medium mb-1" style={{ color: P.text }}>Approved Claims</p>
                <p className="text-2xl font-bold" style={{ color: '#059669' }}>{approvedClaims}</p>
                <p className="text-xs mt-2" style={{ color: P.text }}>Successfully processed and paid</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm font-medium mb-1" style={{ color: P.text }}>Rejected Claims</p>
                <p className="text-2xl font-bold" style={{ color: '#DC2626' }}>{rejectedClaims}</p>
                <p className="text-xs mt-2" style={{ color: P.text }}>Did not meet policy requirements</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-sm font-medium mb-1" style={{ color: P.text }}>Completed Claims</p>
                <p className="text-2xl font-bold" style={{ color: P.teal }}>{completedClaims.length}</p>
                <p className="text-xs mt-2" style={{ color: P.text }}>Resolved and finalized</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}