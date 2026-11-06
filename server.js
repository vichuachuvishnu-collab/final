// Internet-ready Roll Call server. Node.js 18+
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_PIN = process.env.ADMIN_PIN || '';

const DEFAULT_DATA = {
  order: '', orderHtml: '',
  flashMessage: 'IMPORTANT ANNOUNCEMENT',
  announcement: 'IMPORTANT ANNOUNCEMENT',
  publishedAt: '', revision: 0
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-pin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}
async function dbRequest(method, body) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Server database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rollcall?on_conflict=id`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Database error ${response.status}: ${raw}`);
  return raw ? JSON.parse(raw) : [];
}
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/order') {
    if (req.method === 'OPTIONS') return sendJson(res, 200, {ok:true});
    if (req.method === 'GET') {
      try {
        const rows = await dbRequest('GET');
        const row = rows[0];
        if (!row) return sendJson(res, 200, DEFAULT_DATA);
        return sendJson(res, 200, {...DEFAULT_DATA, ...row, flashMessage:row.flash_message ?? DEFAULT_DATA.flashMessage, announcement:row.flash_message ?? DEFAULT_DATA.flashMessage, orderHtml:row.order_html ?? '', publishedAt:row.published_at ?? '', revision:row.revision ?? 0});
      } catch (e) { return sendJson(res, 503, {ok:false,error:e.message}); }
    }
    if (req.method === 'POST') {
      if (!ADMIN_PIN || req.headers['x-admin-pin'] !== ADMIN_PIN) return sendJson(res, 401, {ok:false,error:'Incorrect or missing Admin PIN.'});
      try {
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (raw.length > 1024*1024) throw new Error('Request too large'); }
        const b = JSON.parse(raw || '{}');
        const flash = typeof b.flashMessage === 'string' ? b.flashMessage : (b.announcement || DEFAULT_DATA.flashMessage);
        const record = {
          id: 1,
          order_text: typeof b.order === 'string' ? b.order : '',
          order_html: typeof b.orderHtml === 'string' ? b.orderHtml : '',
          flash_message: flash,
          published_at: new Date().toISOString(),
          revision: Date.now()
        };
        const rows = await dbRequest('POST', record);
        const r = rows[0] || record;
        return sendJson(res, 200, {ok:true,order:r.order_text,orderHtml:r.order_html,flashMessage:r.flash_message,announcement:r.flash_message,publishedAt:r.published_at,revision:r.revision});
      } catch(e) { return sendJson(res, 400, {ok:false,error:e.message}); }
    }
    res.setHeader('Allow','GET, POST, OPTIONS'); return sendJson(res,405,{error:'Method not allowed'});
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end('Method not allowed'); }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (pathname === '/') pathname = '/index.html';
  const requested = path.resolve(ROOT, '.' + pathname);
  if (!requested.startsWith(ROOT + path.sep) && requested !== path.join(ROOT,'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(requested,(err,file)=>{
    if(err){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':MIME[path.extname(requested).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    if(req.method==='HEAD') return res.end();
    res.end(file);
  });
});
server.listen(PORT,HOST,()=>console.log(`Roll Call internet server listening on port ${PORT}`));
