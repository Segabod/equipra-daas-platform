import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role for scheduled automation
    const devices = await base44.asServiceRole.entities.Device.list('-created_date', 500);

    const now = new Date();
    const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let triggered = 0;
    const results = [];

    for (const device of devices) {
      if (!device.refresh_date) continue;
      const refreshDate = new Date(device.refresh_date);
      const daysLeft = Math.floor((refreshDate - now) / (1000 * 60 * 60 * 24));

      // Only trigger for devices in the 85-90 day window (to avoid re-triggering daily)
      if (daysLeft > 90 || daysLeft < 0) continue;

      // Check if we already created a replacement request for this device
      const existing = await base44.asServiceRole.entities.DeviceRequest.filter({
        notes: `AUTO:REFRESH:${device.id}`
      });
      if (existing.length > 0) continue;

      // Create a pre-filled replacement request
      await base44.asServiceRole.entities.DeviceRequest.create({
        request_type: 'replacement',
        quantity: 1,
        delivery_location: device.location || 'Lagos HQ - Victoria Island',
        device_class: device.device_class || 'standard',
        brand: device.brand || '',
        processor: device.processor || '',
        ram: device.ram || '',
        storage: device.storage || '',
        screen_size: device.screen_size || '',
        os: device.os || '',
        service_bundle: 'standard',
        status: 'draft',
        notes: `AUTO:REFRESH:${device.id}`,
        cost_center: device.department || '',
      });

      // Notify the assigned user (or admin)
      await base44.asServiceRole.entities.Notification.create({
        user_email: device.assigned_email || 'admin',
        title: '🔄 Device Refresh Due Soon',
        message: `${device.model} (${device.asset_tag}) is due for refresh in ${daysLeft} days. A replacement request has been drafted automatically.`,
        type: 'refresh_warning',
        link_page: 'RequestHistory',
      });

      triggered++;
      results.push({ asset_tag: device.asset_tag, model: device.model, days_left: daysLeft });
    }

    return Response.json({ success: true, triggered, devices: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});