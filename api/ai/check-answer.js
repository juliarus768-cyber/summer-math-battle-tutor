export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { task, answer, child } = req.body || {};
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ correct: String(answer || '').trim().length > 1, feedback: 'Mock check: add a complete answer.' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Check a child answer. Be kind, short, age-appropriate. Return JSON only: {"correct":boolean,"feedback":"one short sentence"}.' }, { role: 'user', content: JSON.stringify({ child, task, answer }) }], response_format: { type: 'json_object' } }) });
    const data = await r.json();
    res.status(200).json(JSON.parse(data.choices?.[0]?.message?.content || '{"correct":false,"feedback":"Try again."}'));
  } catch { res.status(200).json({ correct: false, feedback: 'Try again with one more detail.' }); }
}
