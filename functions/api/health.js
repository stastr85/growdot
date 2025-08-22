export const onRequestGet = async ({ env }) => {
  return new Response(JSON.stringify({
    ok: true,
    openai: !!env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL || null,
    kv: !!env.LEADS
  }), { headers: { 'content-type': 'application/json' } });
};
