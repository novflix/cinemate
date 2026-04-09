import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // ── Auth: verify the caller is a logged-in user ──────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Body ─────────────────────────────────────────────────────────────────
    const { userId } = await req.json();

    // Security: users can only delete their own avatar
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Cloudinary signed delete ──────────────────────────────────────────────
    const cloudName  = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
    const apiKey     = Deno.env.get('CLOUDINARY_API_KEY')!;
    const apiSecret  = Deno.env.get('CLOUDINARY_API_SECRET')!;
    const publicId   = `cinimate_avatars/user_${userId}`;

    const timestamp  = Math.floor(Date.now() / 1000).toString();

    // Build signature string: public_id=...&timestamp=...  (alphabetical, no API key/secret)
    const sigStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    // SHA-1 via Web Crypto
    const encoder  = new TextEncoder();
    const hashBuf  = await crypto.subtle.digest('SHA-1', encoder.encode(sigStr));
    const signature = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    const fd = new FormData();
    fd.append('public_id',  publicId);
    fd.append('signature',  signature);
    fd.append('api_key',    apiKey);
    fd.append('timestamp',  timestamp);

    const cdnRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: 'POST', body: fd }
    );
    const cdnData = await cdnRes.json();

    // result === 'ok' means deleted; 'not found' means it was already gone — both fine
    if (cdnData.result !== 'ok' && cdnData.result !== 'not found') {
      console.warn('[delete-avatar] Cloudinary unexpected result:', cdnData);
    }

    return new Response(JSON.stringify({ ok: true, result: cdnData.result }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[delete-avatar]', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});