import { NextResponse } from 'next/server';
import { supabaseAdmin, hashPassword, setUserCookie } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const { email, password, name } = await request.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'email, password, name are required' }, { status: 400 });
  }

  // Check duplicate email
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('user_id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });
  }

  const password_hash = hashPassword(password);
  const user_id = randomUUID();

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ user_id, email, name, password_hash })
    .select('user_id, email, name')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({
    success: true,
    user: { id: user.user_id, email: user.email, name: user.name },
  });
  res.headers.set('Set-Cookie', setUserCookie(user.user_id));
  return res;
}
