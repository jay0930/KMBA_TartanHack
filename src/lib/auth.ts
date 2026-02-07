import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase as supabaseAdmin };

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('dayflow-user-id')?.value;
  if (!userId) return null;

  const { data } = await supabase
    .from('users')
    .select('user_id, email, name, profile_image')
    .eq('user_id', userId)
    .single();

  if (!data) return null;
  return { id: data.user_id, email: data.email, name: data.name, profile_image: data.profile_image };
}

export function setUserCookie(userId: string): string {
  return `dayflow-user-id=${userId}; Path=/; HttpOnly; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}
