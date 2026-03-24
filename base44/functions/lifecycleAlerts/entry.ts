import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const devices = await base44.asServiceRole.entities.Device.list('-created_date', 500);

    const now = new Date();
    const results = { warranty: [], eol: [], total: 0 };

    for (const device of devices) {
      // Skip retired/recycled/resold devices
      if (['retired', 'recycled', 'resold', 'donated', 'lost_written_off'].includes(device.disposition_status)) continue;

      // --- Warranty expiry alerts ---
      if (device.warranty_expiry && !device.warranty_alert_sent) {
        const daysLeft = Math.floor((new Date(device.warranty_expiry) - now) / 864e5);
        if (daysLeft <= 60 && daysLeft >= -30) {
          const msg = daysLeft < 0
            ? `Warranty for ${device.model} (${device.asset_tag}) expired ${Math.abs(daysLeft)} days ago.`
            : `Warranty for ${device.model} (${device.asset_tag}) expires in ${daysLeft} days (${device.warranty_expiry}).`;

          await base44.asServiceRole.entities.Notification.create({
            user_email: device.assigned_email || 'admin',
            title: daysLeft < 0 ? '⚠️ Warranty Expired' : '🛡️ Warranty Expiring Soon',
            message: msg,
            type: 'refresh_warning',
            link_page: 'Devices',
          });

          await base44.asServiceRole.entities.Device.update(device.id, { warranty_alert_sent: true });
          results.warranty.push({ asset_tag: device.asset_tag, days_left: daysLeft });
          results.total++;
        }
      }

      // --- End-of-life alerts ---
      if (device.end_of_life_date && !device.eol_alert_sent) {
        const daysLeft = Math.floor((new Date(device.end_of_life_date) - now) / 864e5);
        if (daysLeft <= 90 && daysLeft >= -30) {
          const msg = daysLeft < 0
            ? `${device.model} (${device.asset_tag}) reached end-of-life ${Math.abs(daysLeft)} days ago. Disposition required.`
            : `${device.model} (${device.asset_tag}) reaches end-of-life in ${daysLeft} days (${device.end_of_life_date}).`;

          await base44.asServiceRole.entities.Notification.create({
            user_email: device.assigned_email || 'admin',
            title: daysLeft < 0 ? '🚨 Device End-of-Life Passed' : '📅 Device End-of-Life Approaching',
            message: msg,
            type: 'refresh_warning',
            link_page: 'Devices',
          });

          // Auto-draft a replacement request if not already done
          const existing = await base44.asServiceRole.entities.DeviceRequest.filter({ notes: `AUTO:EOL:${device.id}` });
          if (existing.length === 0) {
            await base44.asServiceRole.entities.DeviceRequest.create({
              request_type: 'replacement',
              quantity: 1,
              delivery_location: device.location || 'Lagos HQ - Victoria Island',
              device_class: device.device_class || 'standard',
              brand: device.brand || '',
              status: 'draft',
              notes: `AUTO:EOL:${device.id}`,
              cost_center: device.department || '',
            });
          }

          await base44.asServiceRole.entities.Device.update(device.id, { eol_alert_sent: true });
          results.eol.push({ asset_tag: device.asset_tag, days_left: daysLeft });
          results.total++;
        }
      }
    }

    return Response.json({ success: true, ...results });
  } catch (error) {
    console.error('lifecycleAlerts error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});