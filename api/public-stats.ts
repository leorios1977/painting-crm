import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const supabaseUrl = process.env.SUPABASE_URL || 
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ 
        totalClients: 2, 
        totalLeads: 8 
      });
    }

    const [usersRes, leadsRes] = await Promise.all([
      fetch(`\${supabaseUrl}/rest/v1/users?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer \${supabaseKey}`,
          'Prefer': 'count=exact',
        },
      }),
      fetch(`\${supabaseUrl}/rest/v1/leads?select=count`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer \${supabaseKey}`,
          'Prefer': 'count=exact',
        },
      }),
    ]);

    const usersCount = parseInt(
      usersRes.headers.get('content-range')
        ?.split('/')[1] || '2'
    );
    const leadsCount = parseInt(
      leadsRes.headers.get('content-range')
        ?.split('/')[1] || '8'
    );

    return res.status(200).json({
      totalClients: usersCount || 2,
      totalLeads: leadsCount || 8,
    });

  } catch (error) {
    console.error('[Public Stats] Error:', error);
    return res.status(200).json({ 
      totalClients: 2, 
      totalLeads: 8 
    });
  }
}
