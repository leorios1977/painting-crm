export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ totalClients: 2, totalLeads: 8 });
    }

    const [usersRes, leadsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }),
      fetch(`${supabaseUrl}/rest/v1/leads?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }),
    ]);

    const usersRange = usersRes.headers.get('content-range') || '0/2';
    const leadsRange = leadsRes.headers.get('content-range') || '0/8';
    const totalClients = parseInt(usersRange.split('/')[1]) || 2;
    const totalLeads = parseInt(leadsRange.split('/')[1]) || 8;

    return res.status(200).json({ totalClients, totalLeads });

  } catch (error) {
    console.error('[Public Stats] Error:', error);
    return res.status(200).json({ totalClients: 2, totalLeads: 8 });
  }
}
