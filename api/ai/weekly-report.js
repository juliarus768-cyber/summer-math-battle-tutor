export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(200).json({ summary: 'Mock summary: celebrate completed routines, recover missing tasks, and keep rewards tied to responsibility.' });
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'Write a short parent summary for two children. Be practical, encouraging, no lectures.' }, { role: 'user', content: JSON.stringify(req.body) }] }) });
    const data = await r.json();
    res.status(200).json({ summary: data.choices?.[0]?.message?.content || 'Good week. Keep routines consistent.' });
  } catch { res.status(200).json({ summary: 'Good week. Keep routines consistent.' }); }
}
