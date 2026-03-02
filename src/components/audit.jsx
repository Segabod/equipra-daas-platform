import { base44 } from '@/api/base44Client';

/**
 * Log an audit event. Silently fails so it never breaks the main action.
 */
export async function logAudit({ action, entityType, entityId, entityLabel, details, oldValue, newValue }) {
  try {
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.AuditLog.create({
      action,
      entity_type: entityType,
      entity_id: entityId || '',
      entity_label: entityLabel || '',
      user_email: user?.email || 'system',
      user_name: user?.full_name || 'System',
      details: details || '',
      old_value: oldValue ? String(oldValue) : '',
      new_value: newValue ? String(newValue) : '',
    });
  } catch (_) {
    // Audit logging should never break the main flow
  }
}