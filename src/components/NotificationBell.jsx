import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCheck, Package, RefreshCw, Wrench, FileText } from 'lucide-react';

const P = { navy: '#0B1F3A', teal: '#0FA3B1', bg: '#F7F9FC', text: '#2E3440', border: '#E1E6EF' };

const TYPE_ICONS = {
  request_submitted: FileText,
  request_status_change: Package,
  refresh_warning: RefreshCw,
  device_repair: Wrench,
};

const TYPE_COLORS = {
  request_submitted: '#0FA3B1',
  request_status_change: '#10B981',
  refresh_warning: '#F59E0B',
  device_repair: '#EF4444',
};

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    if (!userEmail) return;
    const notifs = await base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 30);
    setNotifications(notifs);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unreadOnes = notifications.filter(n => !n.read);
    await Promise.all(unreadOnes.map(n => base44.entities.Notification.update(n.id, { read: true })));
    load();
  };

  const markRead = async (n) => {
    if (!n.read) {
      await base44.entities.Notification.update(n.id, { read: true });
      load();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <Bell className="w-5 h-5" style={{ color: '#2E3440' }} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#EF4444' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ border: `1px solid ${P.border}` }}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${P.border}` }}>
            <h3 className="font-bold" style={{ color: P.navy }}>Notifications {unread > 0 && <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#EF4444' }}>{unread}</span>}</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && <button onClick={markAllRead} className="text-xs font-medium" style={{ color: P.teal }}>Mark all read</button>}
              <button onClick={() => setOpen(false)}><X className="w-4 h-4" style={{ color: P.text }} /></button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: P.border }} />
                <p className="text-sm" style={{ color: P.text }}>No notifications yet</p>
              </div>
            ) : notifications.map(n => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const color = TYPE_COLORS[n.type] || P.teal;
              return (
                <div key={n.id} onClick={() => markRead(n)} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" style={{ borderBottom: `1px solid ${P.border}`, backgroundColor: n.read ? 'white' : '#F0FAFB' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate" style={{ color: P.navy }}>{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: P.teal }}></div>}
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: P.text }}>{n.message}</p>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{new Date(n.created_date).toLocaleDateString()} {new Date(n.created_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {notifications.length > 0 && (
            <div className="p-3" style={{ borderTop: `1px solid ${P.border}` }}>
              <button onClick={() => { setNotifications([]); }} className="w-full text-center text-xs" style={{ color: P.text }}>Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}