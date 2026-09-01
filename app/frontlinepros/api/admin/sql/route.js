import { cookies } from 'next/headers';
import { adminForSession, ADMIN_COOKIE } from '../../../../../lib/fp/admin';
import { runQuery, TABLES } from '../../../../../lib/fp/sqlconsole';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!admin) return Response.json({ ok: false, error: 'Not signed in.' }, { status: 401 });

  const { sql } = await request.json().catch(() => ({}));
  const result = await runQuery(sql);
  if (!result.ok) return Response.json(result, { status: 400 });

  console.info('[fp] admin sql', admin.email, String(sql).slice(0, 200));
  return Response.json(result);
}

export async function GET() {
  const admin = await adminForSession(cookies().get(ADMIN_COOKIE)?.value);
  if (!admin) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, tables: TABLES });
}
