# Vercel API 연결 문제 해결 가이드

## 🚨 가장 가능성 높은 문제들

### 1️⃣ Vercel 환경 변수 미설정 (90% 확률)

**즉시 확인:**
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. Production 탭 확인

**필수 변수 3개:**
```bash
NEXT_PUBLIC_BACKEND_URL=https://kmbatartanhack-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://ilprpsecghmhmquvtron.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_9tzC1E3KH-oZ6-2m7W5EyQ_X8-ajbxw
```

⚠️ **중요:**
- 변수 추가/수정 후 반드시 **Redeploy** 필요!
- Deployments → Latest → Redeploy 버튼 클릭

---

### 2️⃣ Railway Backend 미실행 (5% 확률)

**즉시 테스트:**
```bash
# Terminal에서 실행
curl https://kmbatartanhack-production.up.railway.app/health
```

**예상 응답:**
- ✅ 정상: `{"status":"ok"}` 또는 유사 응답
- ❌ 문제: Connection refused, timeout, 502 Bad Gateway

**Railway 확인:**
1. Railway Dashboard → 프로젝트
2. Backend 서비스 상태: Active? Crashed?
3. Logs 탭에서 최근 에러 확인

---

### 3️⃣ 브라우저에서 실시간 디버깅

**단계별 확인:**

1. **Vercel 배포 URL 접속**
   ```
   https://your-project.vercel.app
   ```

2. **개발자 도구 열기**
   - Chrome: F12 또는 Ctrl+Shift+I
   - Network 탭 선택

3. **페이지 새로고침**
   - Ctrl+Shift+R (캐시 무시 새로고침)

4. **실패한 요청 확인**
   - 빨간색으로 표시된 요청 클릭
   - Headers 탭 확인:
     - Request URL이 올바른지
     - Status Code가 무엇인지 (404? 500? CORS?)
   - Response 탭에서 에러 메시지 확인

5. **Console 탭 확인**
   - CORS 에러: `Access to fetch ... has been blocked by CORS policy`
   - Network 에러: `Failed to fetch`
   - 환경 변수 에러: `undefined` 또는 `localhost`

---

## 📋 체크리스트 (순서대로 확인)

### ✅ Step 1: Vercel 환경 변수
- [ ] `NEXT_PUBLIC_BACKEND_URL` 설정됨
- [ ] Railway URL로 설정됨 (localhost 아님)
- [ ] 환경 변수 저장 후 Redeploy 완료

### ✅ Step 2: Railway Backend
- [ ] Backend 상태: Active
- [ ] Health check 응답 정상
- [ ] Recent logs에 치명적 에러 없음

### ✅ Step 3: CORS (이미 설정됨 ✓)
```python
# dayflow/backend/main.py - 이미 Vercel 지원
allow_origin_regex=r"https://.*\.vercel\.app"
```

### ✅ Step 4: 브라우저 테스트
- [ ] 개발자 도구 Network 탭에서 API 요청 확인
- [ ] `/api/proxy/...` 경로로 요청이 가는지
- [ ] Status code가 200인지
- [ ] Console에 에러 없는지

---

## 🔧 에러별 해결 방법

### Error 1: "Failed to fetch" / Network Error
**원인:** Backend에 도달할 수 없음
**해결:**
1. Railway backend 상태 확인
2. `NEXT_PUBLIC_BACKEND_URL` 확인
3. Vercel Redeploy

### Error 2: CORS Policy 에러
**원인:** CORS 설정 문제 (가능성 낮음, 이미 설정됨)
**해결:**
1. Railway backend logs 확인
2. Backend main.py의 CORS 설정 확인
3. Backend 재배포

### Error 3: 404 Not Found
**원인:** API 경로가 잘못됨
**해결:**
1. API proxy 경로 확인: `/api/proxy/api/...`
2. Backend endpoint 존재 확인

### Error 4: 500 Internal Server Error
**원인:** Backend 서버 에러
**해결:**
1. Railway logs에서 상세 에러 확인
2. Backend 환경 변수 확인
3. Supabase 연결 확인

### Error 5: Unauthorized / 401
**원인:** Cookie 인증 실패
**해결:**
1. 로그인 다시 시도
2. Cookie 설정 확인 (Application → Cookies)
3. `/api/auth/me` 엔드포인트 테스트

---

## 🧪 즉시 테스트 커맨드

### 1. Railway Backend Health Check
```bash
curl https://kmbatartanhack-production.up.railway.app/health
```

### 2. Vercel 배포 상태 확인
```bash
# Vercel CLI 설치 (선택)
npm i -g vercel

# 프로젝트 상태 확인
vercel env ls
```

### 3. 로컬에서 Production 환경 테스트
```bash
# .env.production을 사용하여 로컬 테스트
npm run build
npm start

# 브라우저에서 http://localhost:3000 접속
```

---

## 💡 추가 팁

### Vercel Logs 실시간 확인
1. Vercel Dashboard → Deployments
2. Latest deployment 클릭
3. **Function Logs** 탭에서 실시간 로그 확인
4. API 요청 시 어떤 에러가 발생하는지 확인

### Railway Logs 실시간 확인
1. Railway Dashboard → Backend 서비스
2. **Logs** 탭
3. API 요청 시 backend에 요청이 도달하는지 확인

### 환경 변수 디버깅
Next.js 페이지에 임시로 추가:
```typescript
console.log('BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```
브라우저 Console에서 확인 → localhost면 환경 변수 미설정!

---

## 📞 여전히 문제가 있다면

다음 정보를 공유해주세요:
1. Vercel 배포 URL
2. 브라우저 Console 스크린샷 (에러 메시지)
3. Network 탭에서 실패한 요청의 Headers + Response
4. Railway backend logs (최근 10줄)

이 정보로 정확한 문제를 진단할 수 있습니다.
