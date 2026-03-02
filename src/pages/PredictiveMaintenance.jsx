import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, AlertTriangle, CheckCircle, Clock, Wrench, TrendingDown, Sparkles, RefreshCw, Calendar, ChevronDown, ChevronRight, Zap } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', gold: '#D4AF37', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const RISK_STYLE = {
  critical: { color: '#EF4444', bg: '#FEE2E2', label: 'Critical Risk' },
  high: { color: '#DC2626', bg: '#FECACA', label: 'High Risk' },
  medium: { color: '#F59E0B', bg: '#FEF3C7', label: 'Medium Risk' },
  low: { color: '#10B981', bg: '#D1FAE5', label: 'Low Risk' },
};

function RiskBadge({ level }) {
  const s = RISK_STYLE[level] || RISK_STYLE.low;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PredictionCard({ prediction, onSchedule }) {
  const [expanded, setExpanded] = useState(false);
  const s = RISK_STYLE[prediction.risk_level] || RISK_STYLE.low;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border-l-4" style={{ borderLeftColor: s.color }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm" style={{ color: P.navy }}>{prediction.device_model}</span>
              <span className="text-xs font-mono" style={{ color: P.teal }}>{prediction.asset_tag}</span>
            </div>
            <div className="text-xs" style={{ color: P.text }}>{prediction.assigned_user || 'Unassigned'} · {prediction.department || '—'}</div>
          </div>
          <RiskBadge level={prediction.risk_level} />
        </div>

        <div className="mb-3">
          <div className="text-sm font-semibold mb-1" style={{ color: P.navy }}>{prediction.failure_prediction}</div>
          <div className="text-xs" style={{ color: P.text }}>
            <span className="font-medium">Estimated timeframe: </span>{prediction.timeframe}
          </div>
        </div>

        {prediction.failure_components?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {prediction.failure_components.map((c, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs" style={{ color: P.text }}>
            <TrendingDown className="w-3.5 h-3.5" style={{ color: s.color }} />
            <span>Confidence: <strong style={{ color: P.navy }}>{prediction.confidence}%</strong></span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium flex items-center gap-1" style={{ color: P.teal }}>
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {expanded ? 'Hide' : 'Details'}
            </button>
            {prediction.risk_level !== 'low' && (
              <button onClick={() => onSchedule(prediction)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: s.color }}>
                Schedule Repair
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-3 pt-0">
          <div style={{ borderTop: `1px solid ${P.border}` }} className="pt-3">
            {prediction.root_causes?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-bold mb-2" style={{ color: P.navy }}>Root Cause Analysis</div>
                <ul className="space-y-1">
                  {prediction.root_causes.map((r, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: P.text }}>
                      <span className="mt-0.5" style={{ color: s.color }}>•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {prediction.preventive_actions?.length > 0 && (
              <div>
                <div className="text-xs font-bold mb-2" style={{ color: P.navy }}>Recommended Actions</div>
                <ul className="space-y-1">
                  {prediction.preventive_actions.map((a, i) => (
                    <li key={i} className="text-xs flex items-start gap-2" style={{ color: P.text }}>
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {prediction.estimated_cost && (
              <div className="mt-3 p-2.5 rounded-lg text-xs" style={{ backgroundColor: P.bg }}>
                <span style={{ color: P.text }}>Estimated repair cost: </span>
                <strong style={{ color: P.navy }}>{prediction.estimated_cost}</strong>
                {prediction.downtime_estimate && (
                  <span style={{ color: P.text }}> · Downtime: <strong style={{ color: P.navy }}>{prediction.downtime_estimate}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleModal({ prediction, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    setSaving(true);
    await base44.entities.Ticket.create({
      device_asset_tag: prediction.asset_tag,
      device_model: prediction.device_model,
      assigned_user: prediction.assigned_user,
      department: prediction.department,
      issue_type: 'preventive',
      severity: prediction.risk_level === 'critical' ? 'critical' : prediction.risk_level === 'high' ? 'high' : 'medium',
      description: `[AI Predictive Maintenance] ${prediction.failure_prediction}. Components at risk: ${(prediction.failure_components || []).join(', ')}. ${notes}`,
      status: 'open',
      technician: technician || undefined,
      pickup_time: date || undefined,
    });
    await base44.entities.Notification.create({
      user_email: prediction.assigned_email || 'admin',
      title: 'Maintenance Scheduled',
      message: `Preventive maintenance scheduled for ${prediction.device_model} (${prediction.asset_tag})${date ? ' on ' + new Date(date).toLocaleDateString() : ''}.`,
      type: 'device_repair',
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
          <h2 className="text-lg font-bold" style={{ color: P.navy }}>Schedule Maintenance</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: P.bg }}>
            <div className="font-semibold" style={{ color: P.navy }}>{prediction.device_model}</div>
            <div className="text-xs mt-0.5" style={{ color: P.text }}>{prediction.failure_prediction}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>Scheduled Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>Technician</label>
            <input value={technician} onChange={e => setTechnician(e.target.value)} placeholder="Assign technician..."
              className="w-full px-4 py-2.5 border-2 rounded-xl text-sm" style={{ borderColor: P.border }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: P.navy }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional notes..."
              className="w-full px-4 py-2.5 border-2 rounded-xl text-sm resize-none" style={{ borderColor: P.border }} />
          </div>
        </div>
        <div className="p-6 flex gap-3" style={{ borderTop: `1px solid ${P.border}` }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 font-medium text-sm" style={{ borderColor: P.border, color: P.navy }}>Cancel</button>
          <button onClick={handleSchedule} disabled={saving}
            className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: P.teal }}>
            {saving ? 'Scheduling...' : 'Confirm & Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PredictiveMaintenance() {
  const [devices, setDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [filter, setFilter] = useState('all');
  const [lastRun, setLastRun] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Device.list('-created_date', 200),
      base44.entities.Ticket.list('-created_date', 200),
    ]).then(([d, t]) => {
      setDevices(d);
      setTickets(t);
      setDataLoading(false);
    });
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setPredictions([]);

    // Build rich context for AI
    const deviceSummaries = devices.map(d => {
      const repairHistory = tickets.filter(t => t.device_asset_tag === d.asset_tag);
      const repairCount = repairHistory.length;
      const issueTypes = repairHistory.map(t => t.issue_type).join(', ');
      const lastRepair = repairHistory[0]?.created_date;
      const daysToRefresh = d.refresh_date ? Math.floor((new Date(d.refresh_date) - new Date()) / 86400000) : null;
      const daysToWarranty = d.warranty_expiry ? Math.floor((new Date(d.warranty_expiry) - new Date()) / 86400000) : null;
      const purchaseAge = d.purchase_date ? Math.floor((new Date() - new Date(d.purchase_date)) / 86400000) : null;

      return {
        id: d.id,
        asset_tag: d.asset_tag,
        model: d.model,
        brand: d.brand,
        assigned_user: d.assigned_user,
        assigned_email: d.assigned_email,
        department: d.department,
        status: d.status,
        condition_score: d.condition_score,
        ram: d.ram,
        storage: d.storage,
        processor: d.processor,
        os: d.os,
        purchase_age_days: purchaseAge,
        days_to_refresh: daysToRefresh,
        days_to_warranty_expiry: daysToWarranty,
        repair_count: repairCount,
        recent_issue_types: issueTypes || 'none',
        last_repair_date: lastRepair || 'never',
        monthly_rate: d.monthly_rate,
      };
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert IT hardware analyst performing predictive maintenance analysis for a fleet of ${devices.length} devices. 

Analyze the following device data including repair history, physical condition scores, hardware specs, age, and lifecycle metrics to predict potential hardware failures BEFORE they occur.

DEVICE DATA:
${JSON.stringify(deviceSummaries, null, 2)}

For EACH device, determine:
1. Failure risk level (critical/high/medium/low)
2. Most likely failure type and components at risk
3. Estimated timeframe to failure
4. Root causes based on data patterns
5. Recommended preventive actions
6. Cost estimate

Focus especially on:
- Devices with multiple past repairs (high recidivism = systemic failure risk)
- Devices with low condition scores (< 70%)
- Aging devices (purchase_age_days > 1000)
- Devices with warranty expiring soon (battery/hardware coverage lapsing)
- Devices approaching refresh date
- Common issue patterns (e.g. repeated screen damage = user behavior risk)
- Hardware inadequacy (low RAM/storage = thermal stress, performance degradation)

Return ONLY a JSON array of predictions, one per device, sorted by risk (critical first):`,
      response_json_schema: {
        type: 'object',
        properties: {
          predictions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                asset_tag: { type: 'string' },
                device_model: { type: 'string' },
                assigned_user: { type: 'string' },
                assigned_email: { type: 'string' },
                department: { type: 'string' },
                risk_level: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                failure_prediction: { type: 'string' },
                failure_components: { type: 'array', items: { type: 'string' } },
                timeframe: { type: 'string' },
                confidence: { type: 'number' },
                root_causes: { type: 'array', items: { type: 'string' } },
                preventive_actions: { type: 'array', items: { type: 'string' } },
                estimated_cost: { type: 'string' },
                downtime_estimate: { type: 'string' },
              }
            }
          },
          fleet_summary: { type: 'string' },
          top_risk_factors: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    if (result?.predictions) {
      setPredictions(result.predictions);
      setLastRun(new Date());
    }
    setLoading(false);
  };

  const filtered = predictions.filter(p => filter === 'all' || p.risk_level === filter);

  const criticalCount = predictions.filter(p => p.risk_level === 'critical').length;
  const highCount = predictions.filter(p => p.risk_level === 'high').length;
  const mediumCount = predictions.filter(p => p.risk_level === 'medium').length;
  const lowCount = predictions.filter(p => p.risk_level === 'low').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: P.bg }}>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: P.navy }}>
              <Brain className="w-6 h-6" style={{ color: P.teal }} />AI Predictive Maintenance
            </h1>
            <p className="text-sm mt-0.5" style={{ color: P.text }}>
              Analyzes repair history, condition scores, and device specs to predict failures before they occur
            </p>
            {lastRun && (
              <p className="text-xs mt-1" style={{ color: P.teal }}>
                Last analysis: {lastRun.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading || dataLoading}
            className="px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ backgroundColor: P.teal }}
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Analyzing {devices.length} devices...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Run AI Analysis</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        {predictions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Critical Risk', value: criticalCount, color: '#EF4444', key: 'critical' },
              { label: 'High Risk', value: highCount, color: '#DC2626', key: 'high' },
              { label: 'Medium Risk', value: mediumCount, color: '#F59E0B', key: 'medium' },
              { label: 'Low Risk', value: lowCount, color: '#10B981', key: 'low' },
            ].map(s => (
              <div key={s.key} onClick={() => setFilter(s.key === filter ? 'all' : s.key)}
                className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                style={{ border: filter === s.key ? `2px solid ${s.color}` : '2px solid transparent' }}>
                <div className="text-3xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
                <div className="text-sm font-medium" style={{ color: P.navy }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* No analysis yet */}
        {predictions.length === 0 && !loading && (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${P.teal}15` }}>
              <Brain className="w-8 h-8" style={{ color: P.teal }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: P.navy }}>AI Predictive Maintenance</h2>
            <p className="text-sm mb-1 max-w-md mx-auto" style={{ color: P.text }}>
              Click <strong>Run AI Analysis</strong> to analyze your fleet of <strong>{devices.length} devices</strong> using repair history, condition scores, hardware specs, and lifecycle data.
            </p>
            <p className="text-xs mt-4" style={{ color: P.text }}>
              The AI will identify at-risk devices, predict failure types, and recommend preventive actions with scheduling.
            </p>
            <div className="mt-8 grid md:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
              {[
                { icon: TrendingDown, title: 'Failure Prediction', desc: 'Predict hardware failures 30-90 days in advance' },
                { icon: Wrench, title: 'Root Cause Analysis', desc: 'Identify systemic issues from repair patterns' },
                { icon: Calendar, title: 'Maintenance Scheduling', desc: 'Create repair tickets directly from predictions' },
              ].map((f, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: P.bg }}>
                  <f.icon className="w-5 h-5 mb-2" style={{ color: P.teal }} />
                  <div className="text-sm font-semibold mb-1" style={{ color: P.navy }}>{f.title}</div>
                  <div className="text-xs" style={{ color: P.text }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${P.teal}15` }}>
              <Brain className="w-8 h-8 animate-pulse" style={{ color: P.teal }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: P.navy }}>Analyzing Fleet Data...</h2>
            <p className="text-sm" style={{ color: P.text }}>
              Processing {devices.length} devices and {tickets.length} repair records. This may take 15-30 seconds.
            </p>
            <div className="mt-6 space-y-2 max-w-xs mx-auto text-left">
              {['Scanning repair histories...', 'Evaluating condition scores...', 'Analyzing hardware specs...', 'Generating failure predictions...'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: P.text }}>
                  <Zap className="w-3.5 h-3.5 animate-pulse" style={{ color: P.teal }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && predictions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: P.navy }}>
                {filtered.length} device{filtered.length !== 1 ? 's' : ''} {filter !== 'all' ? `with ${filter} risk` : 'analyzed'}
              </h2>
              <div className="flex gap-2">
                {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
                    style={{ backgroundColor: filter === f ? P.navy : P.bg, color: filter === f ? 'white' : P.text }}>
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map((p, i) => (
                <PredictionCard key={i} prediction={p} onSchedule={setScheduleTarget} />
              ))}
            </div>
          </>
        )}
      </div>

      {scheduleTarget && (
        <ScheduleModal
          prediction={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onDone={() => { setScheduleTarget(null); alert('Maintenance ticket created and notification sent!'); }}
        />
      )}
    </div>
  );
}