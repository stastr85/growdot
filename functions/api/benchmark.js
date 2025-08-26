export const onRequestPost = async ({ request, env }) => {
  try {
    const { company, region } = await request.json();
    const name = (company || '').toString().trim();
    const reg = (region || 'US').toString().trim();
    if (name.length < 2 || name.length > 80) {
      return json({ error: 'Invalid company name.' }, 400);
    }
    if (!env.OPENAI_API_KEY) {
      return json({ error: 'Server is not configured.' }, 500);
    }

    const system = [
      'You are a senior business analyst specializing in competitive benchmarking.',
      'Task: analyze the named company in the context of the Belarus market.',
      'Structure your response in 4 sections:1. **Company Overview** — summarize the companys positioning, business model, and market presence.',
'2. **Benchmark vs US Peers** — compare key metrics (e.g., margins, growth, cost structure) against US industry averages.',
'3. **Strengths & Gaps** — highlight competitive advantages and areas for improvement.',
'4. **Actionable Recommendations** — suggest 2–3 strategic steps the company could take to improve performance.',

'Tone: professional, neutral, data-driven. Avoid disclaimers or speculation. Use 300–500 words.',
      'If the company is unknown, provide a generic sector-based benchmark.',
      'Cover: positioning, strengths, gaps vs US peers, and 1 actionable next step.'
    ].join(' ');

    const user = `Company: "${name}". Region: ${reg}.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 320,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return json({ error: `Upstream error: ${resp.status} ${txt.slice(0,300)}` }, 502);
    }
    const data = await resp.json();
    const summary = (data?.choices?.[0]?.message?.content || '').trim();
    if (!summary) return json({ error: 'Empty response.' }, 502);

    return json({ summary });
  } catch (e) {
    return json({ error: e.message || 'Unexpected error' }, 500);
  }
};

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
