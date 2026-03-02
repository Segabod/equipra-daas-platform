import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function DatabaseExport() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setStatus(null);
    
    try {
      const response = await base44.functions.invoke('exportDatabase');
      
      if (response.data.success) {
        setSummary(response.data.summary);
        setStatus({ type: 'success', message: 'Export completed! Downloading files...' });
        
        // Create and download CSV files
        Object.entries(response.data.csvFiles).forEach(([name, csv]) => {
          if (csv) {
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${name}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
        
        setTimeout(() => setLoading(false), 1000);
      } else {
        setStatus({ type: 'error', message: 'Export failed' });
        setLoading(false);
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Export failed' });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: '#0B1F3A' }}>Export Database to CSV</h2>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Download all database records as CSV files</p>
        </div>
        <Button 
          onClick={handleExport} 
          disabled={loading}
          style={{ backgroundColor: '#0FA3B1' }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </>
          )}
        </Button>
      </div>

      {status && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          status.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={status.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {status.message}
            </p>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F7F9FC', border: '1px solid #E1E6EF' }}>
          {Object.entries(summary).map(([key, value]) => {
            if (key === 'exportDate') return null;
            return (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#0B1F3A' }}>{value}</div>
                <div className="text-xs mt-1 capitalize" style={{ color: '#6B7280' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: '#F0F9FF', border: '1px solid #E0F2FE', color: '#0369A1' }}>
        <p><strong>Note:</strong> You'll receive separate CSV files for each data table (users, devices, requests, tickets, claims, etc.). All files are timestamped with the export date.</p>
      </div>
    </div>
  );
}