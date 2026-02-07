# Vercel - Supabase 연결 문제 해결 가이드

## 🚨 가장 가능성 높은 문제들

### 1️⃣ Vercel 환경 변수 미설정 (80% 확률)

**즉시 확인:**
```
Vercel Dashboard → Settings → Environment Variables → Production
```

**필수 2개 변수:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ilprpsecghmhmquvtron.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9tzC1E3KH-oZ6-2m7W5EyQ_X8-ajbxw
```

⚠️ **주의사항:**
- `NEXT_PUBLIC_` 접두사 필수!
- URL은 `https://`로 시작
- Key 전체가 잘리지 않았는지 확인
- **변경 후 반드시 Redeploy!**

---

### 2️⃣ Supabase 프로젝트 Paused (10% 확률)

**즉시 확인:**
```
https://supabase.com/dashboard
```

1. `ilprpsecghmhmquvtron` 프로젝트 선택
2. 상태 확인: 🟢 Active? ⏸️ Paused?

**Paused 상태라면:**
- 무료 플랜은 1주일 미사용 시 자동 일시정지
- "Resume Project" 클릭하여 재활성화
- 약 1-2분 소요

---

### 3️⃣ Vercel 도메인 미허용 (5% 확률)

**Supabase Dashboard:**
```
Settings → Authentication → URL Configuration
```

**추가 필요:**
```
Site URL:
https://your-project.vercel.app

Redirect URLs:
https://your-project.vercel.app/**
https://your-project.vercel.app/api/auth/callback
http://localhost:3000/**
```

---

## 🧪 즉시 테스트 커맨드

### 1. Supabase API 직접 테스트
```bash
curl -X GET 'https://ilprpsecghmhmquvtron.supabase.co/rest/v1/users?select=*&limit=1' \
  -H "apikey: sb_publishable_9tzC1E3KH-oZ6-2m7W5EyQ_X8-ajbxw" \
  -H "Authorization: Bearer sb_publishable_9tzC1E3KH-oZ6-2m7W5EyQ_X8-ajbxw"
```

**예상 결과:**
- ✅ `[]` 또는 JSON 데이터 → 연결 정상
- ❌ `{"message":"Invalid API key"}` → API key 문제
- ❌ `{"hint":...,"message":"..."}` → RLS 정책 문제
- ❌ Connection refused → 프로젝트 Paused

### 2. 브라우저에서 테스트
```
1. Vercel 사이트 접속
2. F12 → Console 탭
3. 다음 입력:

console.log({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)
});
```

**예상 출력:**
```javascript
{
  url: "https://ilprpsecghmhmquvtron.supabase.co",
  key: "sb_publishable_9tzC1"
}
```

**만약 undefined:**
→ Vercel 환경 변수 미설정!

---

## 📋 단계별 체크리스트

### Phase 1: Vercel 설정
- [ ] 환경 변수 `NEXT_PUBLIC_SUPABASE_URL` 추가
- [ ] 환경 변수 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- [ ] Environment: Production 선택
- [ ] Save 후 Redeploy 실행
- [ ] 배포 완료 대기 (2-3분)

### Phase 2: Supabase 확인
- [ ] 프로젝트 상태: Active 확인
- [ ] API Keys 일치 확인
- [ ] Database 테이블 존재 확인 (users, diaries)
- [ ] Vercel 도메인 추가 (URL Configuration)

### Phase 3: 브라우저 테스트
- [ ] 배포된 사이트 접속
- [ ] F12 → Console → 환경 변수 확인
- [ ] Network 탭 → supabase.co 요청 확인
- [ ] 에러 없이 200 응답 확인

---

## 🔧 에러별 빠른 해결

### Error: "Invalid API key"
**원인:** API key 불일치
**해결:**
1. Supabase Dashboard → Settings → API
2. `anon` key 복사
3. Vercel 환경 변수 업데이트
4. Redeploy

### Error: "Project is paused"
**원인:** 프로젝트 일시정지
**해결:**
1. Supabase Dashboard
2. Resume Project 클릭
3. 1-2분 대기
4. 다시 테스트

### Error: 403 Forbidden (RLS)
**원인:** Row Level Security 정책 문제
**해결:**
1. Supabase → Database → Tables
2. RLS Policies 확인
3. Policy 수정 또는 비활성화 (테스트용)

### Error: undefined (환경 변수)
**원인:** Vercel 환경 변수 미설정
**해결:**
1. Vercel → Settings → Environment Variables
2. 변수 추가
3. **반드시 Redeploy!**

---

## 💡 디버깅 코드

페이지에 임시로 추가하여 테스트:

```typescript
// src/app/page.tsx 또는 layout.tsx
useEffect(() => {
  console.log('=== Supabase Connection Test ===');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + '...');

  // 실제 연결 테스트
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data.session ? 'Exists' : 'None');
    console.log('Error:', error);
  });
}, []);
```

---

## 📊 에러 코드 빠른 참조

| 코드 | 의미 | 원인 | 해결 |
|------|------|------|------|
| 401 | Unauthorized | API key 문제 | Key 확인 |
| 403 | Forbidden | RLS 정책 | Policy 수정 |
| 404 | Not Found | 테이블 없음 | Database 확인 |
| 503 | Service Unavailable | 프로젝트 Paused | Resume Project |

---

## 🎯 빠른 체크 (3분 안에)

```bash
# 1. Supabase API 테스트
curl https://ilprpsecghmhmquvtron.supabase.co/rest/v1/ \
  -H "apikey: sb_publishable_9tzC1E3KH-oZ6-2m7W5EyQ_X8-ajbxw"

# 2. Vercel 환경 변수 확인
# Vercel Dashboard → Settings → Environment Variables

# 3. 브라우저 Console 확인
# F12 → process.env.NEXT_PUBLIC_SUPABASE_URL
```

---

## 📞 추가 도움이 필요하면

다음 정보를 공유해주세요:
1. **브라우저 Console** 스크린샷 (환경 변수 출력)
2. **Network 탭** 실패한 Supabase 요청의 Response
3. **Vercel Logs** (Function Logs에서 Supabase 관련 에러)
4. **Supabase 상태** (Active? Paused?)

이 정보로 정확한 원인을 찾을 수 있습니다!
