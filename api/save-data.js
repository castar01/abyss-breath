module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('save-data: missing KV env vars', {
      url: !!process.env.KV_REST_API_URL,
      token: !!process.env.KV_REST_API_TOKEN
    });
    return res.status(500).json({ error: 'Server KV credentials missing' });
  }

  try {
    var data = req.body;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = null; }
    }
    if (!data || !data.participantId) {
      console.warn('save-data: missing participantId, body=', req.body);
      return res.status(400).json({ error: 'Missing participantId' });
    }

    var group = data.group === 'ctrl' ? 'ctrl' : 'exp';
    var listKey = group === 'ctrl' ? 'game_data_ctrl' : 'game_data';

    var record = JSON.stringify({
      participantId: data.participantId,
      oxygenValue: data.oxygenValue,
      ending: data.ending,
      group: group,
      timestamp: data.timestamp || new Date().toISOString()
    });

    var upstashUrl = process.env.KV_REST_API_URL.replace(/\/+$/, '');

    var response = await fetch(upstashUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['LPUSH', listKey, record])
    });

    var raw = await response.text();
    var result;
    try { result = JSON.parse(raw); } catch (e) { result = { raw: raw }; }

    if (!response.ok || result.error) {
      console.error('save-data upstash error:', response.status, result);
      return res.status(502).json({ error: 'Upstash write failed', detail: result, status: response.status });
    }

    console.log('save-data ok:', listKey, result);
    return res.status(200).json({ success: true, listKey: listKey, result: result });
  } catch (err) {
    console.error('save-data exception:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Failed to save data', detail: String(err && err.message || err) });
  }
};
