module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var data = req.body;
    if (!data || !data.participantId) {
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

    var response = await fetch(process.env.KV_REST_API_URL, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['LPUSH', listKey, record])
    });

    var result = await response.json();
    if (result.error) throw new Error(result.error);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('save-data error:', err);
    return res.status(500).json({ error: 'Failed to save data' });
  }
};
