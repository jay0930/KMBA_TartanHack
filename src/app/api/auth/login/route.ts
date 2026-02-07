import { NextResponse } from 'next/server';
import { supabaseAdmin, hashPassword, setUserCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('user_id, email, name, password_hash')
    .eq('email', email)
    .single();

  if (!user) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 틀립니다' }, { status: 401 });
  }

  if (user.password_hash !== hashPassword(password)) {
    return NextResponse.json({ error: '이메일 또는 비밀번호가 틀립니다' }, { status: 401 });
  }

  const res = NextResponse.json({
    success: true,
    user: { id: user.user_id, email: user.email, name: user.name },
  });
  res.headers.set('Set-Cookie', setUserCookie(user.user_id));
  return res;
}
