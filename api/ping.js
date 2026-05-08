module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var diag = {
    timestamp: new Date().toISOString(),
    envCheck: {
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN
    },
    counts: {}
  };

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json(Object.assign(diag, {
      ok: false,
      stage: 'env',
      error: 'Missing KV credentials in environment variables'
    }));
  }

  var upstashUrl = process.env.KV_REST_API_URL.replace(/\/+$/, '');
  var headers = {
    Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
    'Content-Type': 'application/json'
  };

  async function call(cmd) {
    var r = await fetch(upstashUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(cmd)
    });
    var raw = await r.text();
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { parsed = { raw: raw }; }
    return { status: r.status, ok: r.ok, body: parsed };
  }

  try {
    var testKey = '__ping_test__';
    var testValue = 'pong_' + Date.now();

    var setResp = await call(['SET', testKey, testValue, 'EX', 60]);
    diag.set = setResp;
    if (!setResp.ok) {
      return res.status(502).json(Object.assign(diag, { ok: false, stage: 'set' }));
    }

    var getResp = await call(['GET', testKey]);
    diag.get = getResp;
    if (!getResp.ok || getResp.body.result !== testValue) {
      return res.status(502).json(Object.assign(diag, {
        ok: false,
        stage: 'get',
        error: 'Read-back mismatch'
      }));
    }

    await call(['DEL', testKey]);

    var expCount = await call(['LLEN', 'game_data']);
    var ctrlCount = await call(['LLEN', 'game_data_ctrl']);
    diag.counts.exp = expCount.body.result;
    diag.counts.ctrl = ctrlCount.body.result;

    return res.status(200).json(Object.assign(diag, {
      ok: true,
      message: 'Upstash connection healthy'
    }));
  } catch (err) {
    return res.status(500).json(Object.assign(diag, {
      ok: false,
      stage: 'exception',
      error: String(err && err.message || err)
    }));
  }
};
