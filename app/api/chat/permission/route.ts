import { resolvePermission } from '@/lib/chat/permissions';

export async function POST(req: Request) {
  const { permissionId, behavior, message } = await req.json();

  if (!permissionId || !behavior) {
    return Response.json({ ok: false, error: 'Missing permissionId or behavior' }, { status: 400 });
  }

  if (behavior !== 'allow' && behavior !== 'deny') {
    return Response.json({ ok: false, error: 'behavior must be "allow" or "deny"' }, { status: 400 });
  }

  const resolved = resolvePermission(permissionId, behavior, message);
  return Response.json({ ok: resolved });
}
