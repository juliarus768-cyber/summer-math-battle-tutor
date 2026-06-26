export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ tasks: [] });
  try {
    const { child, date } = req.body || {};
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Create short motivating family productivity tasks. Return JSON only: {"tasks":[{"section":"Brain Missions","title":"...","prompt":"...","answer":"open","aiVerifiable":true,"xp":10,"coins":5}]}' }, { role: 'user', content: JSON.stringify({ child, date }) }], response_format: { type: 'json_object' } }) });
    const data = await r.json();
    res.status(200).json(JSON.parse(data.choices?.[0]?.message?.content || '{"tasks":[]}'));
  } catch (e) { res.status(200).json({ tasks: [] }); }
}
