import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, Package, AlertTriangle, CheckCircle, RefreshCw, Zap, Brain, BarChart3, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

function PriorityBadge({ p }) {
  const styles = {
    critical: { bg: '#FEE2E2', color: '#DC2626' },
    high: { bg: '#FEE2E2', color: '#EF4444' },
    medium: { bg: '#FEF3C7', color: '#D97706' },
    low: { bg: '#D1FAE5', color: '#059669' },
    opportunity: { bg: '#EDE9FE', color: '#7C3AED' },
  };
  const s = styles[p] || styles.low;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase" style={s}>{p}</span>;
}

export default function Procurement() {
  const [devices, setDevices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      base44.entities.Device.list('-created_date', 500),
      base44.entities.DeviceRequest.list('-created_date', 200),
    ]).then(([d, r]) => { setDevices(d); setRequests(r); setLoading(false); });
  }, []);

  const daysUntil = (d) => d ? Math.floor((new Date(d) - new Date()) / 864e5) : 9999;

  // Derived stats from real data
  const refreshSoon = devices.filter(d => daysUntil(d.refresh_date) <= 90 && daysUntil(d.refresh_date) >= 0);
  const refreshOverdue = devices.filter(d => daysUntil(d.refresh_date) < 0 && d.refresh_date);
  const byClass = ['standard', 'developer', 'executive'].map(cls => ({
    class: cls, count: devices.filter(d => d.device_class === cls).length,
  }));
  const monthlyRevenue = devices.reduce((s, d) => s + (d.monthly_rate || 0), 0);
  const avgMonthlyRate = monthlyRevenue / (devices.length || 1);

  // Refresh volume by month (next 6 months)
  const refreshByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const count = devices.filter(dev => {
      if (!dev.refresh_date) return false;
      const rd = new Date(dev.refresh_date);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === year;
    }).length;
    return { month: `${month} ${year}`, count };
  });

  // Request trends (last 6 months)
  const reqTrends = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5 + i);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const count = requests.filter(r => {
      const cd = new Date(r.created_date);
      return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear();
    }).length;
    return { month, requests: count };
  });

  const handleAIAnalyze = async () => {
    setAnalyzing(true);
    const prompt = `You are a Device-as-a-Service (DaaS) procurement AI analyst for EquipraAfrica, a Nigerian B2B tech company.

Analyze the following REAL fleet data and provide actionable procurement insights:

Fleet Overview:
- Total devices: ${devices.length}
- Deployed: ${devices.filter(d => d.status === 'deployed').length}
- In Stock: ${devices.filter(d => d.status === 'in_stock').length}
- In Repair: ${devices.filter(d => d.status === 'in_repair').length}
- Standard class: ${byClass.find(b => b.class === 'standard')?.count || 0}
- Developer class: ${byClass.find(b => b.class === 'developer')?.count || 0}
- Executive class: ${byClass.find(b => b.class === 'executive')?.count || 0}

Refresh Urgency:
- Overdue for refresh: ${refreshOverdue.length} devices
- Refresh due in 90 days: ${refreshSoon.length} devices
- Refresh due next 6 months by month: ${refreshByMonth.map(m => `${m.month}: ${m.count}`).join(', ')}

Financials:
- Total monthly revenue: ₦${monthlyRevenue.toLocaleString()}
- Avg monthly rate per device: ₦${Math.round(avgMonthlyRate).toLocaleString()}

Recent Requests (last 200): ${requests.length} total, types: ${['new_hire','expansion','replacement','upgrade','loaner'].map(t => `${t}: ${requests.filter(r => r.request_type === t).length}`).join(', ')}

Provide a JSON response with:
{
  "summary": "2-3 sentence executive summary of procurement health",
  "procurement_score": number 0-100 (overall procurement health score),
  "recommendations": [
    {
      "title": "short title",
      "priority": "critical|high|medium|low|opportunity",
      "category": "bulk_purchase|refresh|cost|risk|opportunity",
      "impact": "1-line expected impact",
      "detail": "2-3 sentence actionable recommendation with specific numbers/timelines",
      "estimated_saving": "₦X or percentage if applicable, else null",
      "action_items": ["item 1", "item 2", "item 3"]
    }
  ],
  "optimal_purchase_windows": [
    { "month": "month name", "reason": "why this is optimal", "volume": "suggested number" }
  ],
  "predicted_demand": {
    "next_quarter": number,
    "next_6_months": number,
    "breakdown": "brief explanation"
  },
  "cost_optimization": {
    "potential_monthly_saving": "₦X",
    "strategies": ["strategy 1", "strategy 2"]
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          procurement_score: { type: 'number' },
          recommendations: { type: 'array', items: { type: 'object' } },
          optimal_purchase_windows: { type: 'array', items: { type: 'object' } },
          predicted_demand: { type: 'object' },
          cost_optimization: { type: 'object' },
        },
      },
    });
    setAiReport(result);
    setAnalyzing(false);
  };

  const handleAutoRequest = async (rec) => {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.DeviceRequest.create({
      request_type: 'replacement',
      quantity: refreshSoon.length + refreshOverdue.length,
      delivery_location: 'Lagos HQ - Victoria Island',
      device_class: 'standard',
      notes: `AI-recommended procurement: ${rec.title}. ${rec.detail}`,
      status: 'pending_approval',
      approver: 'Amaka Okafor - CFO',
    });
    await base44.entities.Notification.create({
      user_email: user?.email || 'admin',
      title: 'AI Procurement Request Created',
      message: `An AI-optimized device request for ${refreshSoon.length + refreshOverdue.length} devices has been submitted for approval.`,
      type: 'request_submitted',
      link_page: 'RequestHistory',
    });
    alert('Procurement request submitted for approval!');
  };

  const scoreColor = (s) => s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444';
  const catIcon = { bulk_purchase: Package, refresh: RefreshCw, cost: DollarSign, risk: AlertTriangle, opportunity: TrendingUp };

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: P.navy }}>
                <Brain className="w-6 h-6" style={{ color: P.teal }} />AI Procurement Optimizer
              </h1>
              <p className="text-sm mt-0.5" style={{ color: P.text }}>AI-powered demand forecasting, bulk purchase timing & cost optimization</p>
            </div>
            <button onClick={handleAIAnalyze} disabled={analyzing || loading}
              className="px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: analyzing ? P.text : P.teal }}>
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? 'Analyzing...' : aiReport ? 'Re-analyze' : 'Run AI Analysis'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Devices Overdue Refresh', value: refreshOverdue.length, color: '#EF4444', icon: AlertTriangle, sub: 'Immediate action needed' },
            { label: 'Refresh Due in 90 Days', value: refreshSoon.length, color: '#F59E0B', icon: RefreshCw, sub: 'Plan procurement' },
            { label: 'Fleet Monthly Revenue', value: `₦${(monthlyRevenue / 1e6).toFixed(1)}M`, color: P.gold, icon: DollarSign, sub: 'Across all devices' },
            { label: 'Total Device Requests', value: requests.length, color: P.teal, icon: Package, sub: 'Historical demand' },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${k.color}15` }}>
                <k.icon className="w-5 h-5" style={{ color: k.color }} />
              </div>
              <div className="text-2xl font-black mb-0.5" style={{ color: k.color }}>{loading ? '—' : k.value}</div>
              <div className="text-sm font-medium" style={{ color: P.navy }}>{k.label}</div>
              <div className="text-xs mt-0.5" style={{ color: P.text }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-bold mb-4" style={{ color: P.navy }}>Refresh Volume — Next 6 Months</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={refreshByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: P.text }} />
                <YAxis tick={{ fontSize: 10, fill: P.text }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Devices" fill={P.teal} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-base font-bold mb-4" style={{ color: P.navy }}>Request Demand Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={reqTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={P.border} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: P.text }} />
                <YAxis tick={{ fontSize: 10, fill: P.text }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke={P.gold} strokeWidth={2.5} dot={{ r: 4, fill: P.gold }} name="Requests" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Report */}
        {!aiReport && !analyzing && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${P.teal}15` }}>
              <Brain className="w-8 h-8" style={{ color: P.teal }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: P.navy }}>Run AI Analysis</h3>
            <p className="mb-6 max-w-md mx-auto text-sm" style={{ color: P.text }}>
              Click "Run AI Analysis" to get AI-powered procurement recommendations based on your real fleet data — including optimal bulk purchase timing, predicted demand, and cost savings.
            </p>
            <button onClick={handleAIAnalyze} className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 mx-auto" style={{ backgroundColor: P.teal }}>
              <Sparkles className="w-4 h-4" />Analyze My Fleet
            </button>
          </div>
        )}

        {analyzing && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-6" style={{ borderColor: `${P.teal}30`, borderTopColor: P.teal }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: P.navy }}>Analyzing Fleet Data...</h3>
            <p className="text-sm" style={{ color: P.text }}>Reviewing refresh cycles, demand patterns, cost trends, and market conditions...</p>
          </div>
        )}

        {aiReport && !analyzing && (
          <div className="space-y-6">
            {/* Score + Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-6">
                <div className="text-center flex-shrink-0">
                  <div className="text-6xl font-black" style={{ color: scoreColor(aiReport.procurement_score) }}>{aiReport.procurement_score}</div>
                  <div className="text-sm font-medium mt-1" style={{ color: P.text }}>Procurement Score</div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: P.navy }}>
                    <Sparkles className="w-5 h-5" style={{ color: P.teal }} />AI Executive Summary
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: P.text }}>{aiReport.summary}</p>
                  {aiReport.predicted_demand && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: P.bg }}>
                        <div className="text-xl font-black" style={{ color: P.teal }}>{aiReport.predicted_demand.next_quarter}</div>
                        <div className="text-xs" style={{ color: P.text }}>Predicted next quarter</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ backgroundColor: P.bg }}>
                        <div className="text-xl font-black" style={{ color: P.navy }}>{aiReport.predicted_demand.next_6_months}</div>
                        <div className="text-xs" style={{ color: P.text }}>Predicted 6 months</div>
                      </div>
                      {aiReport.cost_optimization && (
                        <div className="p-3 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                          <div className="text-xl font-black text-green-600">{aiReport.cost_optimization.potential_monthly_saving}</div>
                          <div className="text-xs text-green-700">Potential monthly saving</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5" style={{ borderBottom: `1px solid ${P.border}` }}>
                <h3 className="text-lg font-bold" style={{ color: P.navy }}>AI Recommendations ({aiReport.recommendations?.length || 0})</h3>
              </div>
              <div className="divide-y" style={{ borderColor: P.border }}>
                {(aiReport.recommendations || []).map((rec, i) => {
                  const Icon = catIcon[rec.category] || Zap;
                  return (
                    <div key={i} className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${P.teal}15` }}>
                          <Icon className="w-5 h-5" style={{ color: P.teal }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm" style={{ color: P.navy }}>{rec.title}</span>
                            <PriorityBadge p={rec.priority} />
                            {rec.estimated_saving && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Save {rec.estimated_saving}</span>}
                          </div>
                          <p className="text-xs font-medium mb-1" style={{ color: P.teal }}>{rec.impact}</p>
                          <p className="text-sm mb-3 leading-relaxed" style={{ color: P.text }}>{rec.detail}</p>
                          {rec.action_items?.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                              {rec.action_items.map((a, j) => (
                                <div key={j} className="flex items-start gap-2 text-xs" style={{ color: P.text }}>
                                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: P.teal }} />{a}
                                </div>
                              ))}
                            </div>
                          )}
                          {(rec.priority === 'critical' || rec.priority === 'high') && (
                            <button onClick={() => handleAutoRequest(rec)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5" style={{ backgroundColor: P.teal }}>
                              <Zap className="w-3 h-3" />Auto-create Procurement Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optimal Purchase Windows */}
            {aiReport.optimal_purchase_windows?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: P.navy }}>
                  <Calendar className="w-5 h-5" style={{ color: P.teal }} />Optimal Bulk Purchase Windows
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {aiReport.optimal_purchase_windows.map((w, i) => (
                    <div key={i} className="p-4 rounded-xl border-2" style={{ borderColor: P.border }}>
                      <div className="font-bold mb-1" style={{ color: P.navy }}>{w.month}</div>
                      <div className="text-sm mb-2" style={{ color: P.text }}>{w.reason}</div>
                      <div className="text-xs font-semibold" style={{ color: P.teal }}>Recommended volume: {w.volume}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Optimization */}
            {aiReport.cost_optimization?.strategies?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: P.navy }}>
                  <DollarSign className="w-5 h-5" style={{ color: '#10B981' }} />Cost Optimization Strategies
                </h3>
                <div className="space-y-3">
                  {aiReport.cost_optimization.strategies.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}