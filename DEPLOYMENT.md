# DayFlow Deployment Guide

## 🚀 Vercel Deployment (Frontend)

### Prerequisites
- Vercel account connected to GitHub
- Backend deployed on Railway (or other platform)

### Environment Variables
Set these in Vercel dashboard (Settings → Environment Variables):

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Deploy Steps

1. **Connect GitHub Repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Click "Deploy"

4. **Configure Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain (e.g., `dayflow.app`)
   - Update DNS records as instructed

### Automatic Deployments
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

---

## 🚂 Railway Deployment (Backend)

### Prerequisites
- Railway account
- GitHub repository with backend code

### Environment Variables
Set these in Railway dashboard (Variables tab):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEDALUS_API_KEY=your-dedalus-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Deploy Steps

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Build**
   - Railway will auto-detect Python
   - Root directory: `dayflow/backend`
   - Build command: (auto-detected from requirements.txt)
   - Start command: Defined in `railway.toml`

3. **Set Environment Variables**
   - Add all required variables
   - Click "Deploy"

4. **Get Deployment URL**
   - Copy the generated URL (e.g., `https://your-app.railway.app`)
   - Update frontend `NEXT_PUBLIC_BACKEND_URL`

---

## 📦 Production Checklist

### Frontend
- [x] Favicon and PWA icons configured
- [x] Metadata (OG, Twitter) set
- [x] robots.txt created
- [x] sitemap.xml configured
- [x] Security headers added
- [ ] Custom domain configured
- [ ] Analytics integrated (optional)
- [ ] Error tracking (Sentry, etc.) configured (optional)

### Backend
- [x] Environment variables set
- [x] CORS configured for production domain
- [x] Database migrations run
- [x] Service role key configured
- [ ] Rate limiting configured (optional)
- [ ] Monitoring/logging setup (optional)

### Database (Supabase)
- [ ] Row Level Security (RLS) policies reviewed
- [ ] Database backups configured
- [ ] Production credentials secured

---

## 🔒 Security Best Practices

1. **Never commit secrets**
   - Use `.env.local` for development
   - Set environment variables in platform dashboards
   - Rotate keys if accidentally exposed

2. **API Keys**
   - Use `NEXT_PUBLIC_*` only for client-safe keys
   - Keep sensitive keys server-side only

3. **CORS**
   - Update backend CORS to allow production domain
   - Remove `localhost` from production CORS

4. **Authentication**
   - Ensure Supabase RLS policies are active
   - Test auth flows in production

---

## 📊 Monitoring & Maintenance

### Vercel Dashboard
- Check deployment logs
- Monitor performance metrics
- View analytics

### Railway Dashboard
- Monitor resource usage
- Check application logs
- Set up health checks

### Supabase Dashboard
- Monitor database queries
- Check auth logs
- Review API usage

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
```python
# In dayflow/backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Environment Variables Not Working**
- Ensure `NEXT_PUBLIC_` prefix for client-side vars
- Rebuild after changing env vars
- Check variable names match exactly

**3. Build Failures**
- Check build logs in Vercel/Railway
- Verify all dependencies in package.json/requirements.txt
- Test build locally: `npm run build`

**4. Database Connection Issues**
- Verify Supabase credentials
- Check RLS policies
- Ensure service role key is set for backend

---

## 🔄 Updating Deployments

### Frontend Updates
```bash
git add .
git commit -m "Update: description"
git push origin main
# Vercel auto-deploys
```

### Backend Updates
```bash
# Backend updates via GitHub push
# Railway auto-deploys when backend files change
```

### Database Schema Changes
```sql
-- Run migrations in Supabase SQL Editor
-- Or use migration files in dayflow/backend/migrations/
```

---

## 📞 Support

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
