export const onRequestPost = async ({ request, env }) => {
  try {
    const { company, email, summary } = await request.json();
    const name = (company || '').toString().trim();
    const mail = (email || '').toString().trim().toLowerCase();
    if (name.length < 2) return json({ error: 'Company required.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return json({ error: 'Invalid email.' }, 400);
    if (!env.LEADS) return json({ error: 'Storage not configured.' }, 500);

    const ts = Date.now();
    const key = `lead:${ts}:${slug(name).slice(0,64)}`;
    const value = JSON.stringify({ ts, company: name, email: mail, summary: (summary||'').toString().slice(0,1200) });
    await env.LEADS.put(key, value, { metadata: { company: name, email: mail }, expirationTtl: 60*60*24*30 });

    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message || 'Unexpected error' }, 500);
  }
};

function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}
