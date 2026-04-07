# 🚀 STEP-BY-STEP: Copy Environment Variables to Vercel

## ⚠️ You Have localhost URLs - Must Change!

Two variables need different values for production:

| Variable | Your Value (localhost) | Should Be (production) |
|----------|----------------------|---------------------|
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://badekshop.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://badekshop.vercel.app` |

---

## 📋 Variables to Copy

### Required (Copy These Exactly)

```bash
# 1. DATABASE_URL (Copy from .env.local)
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_Nywz40BXKTuk@ep-frosty-mode-a7clcor8-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
Env: Production, Preview, Development

# 2. BETTER_AUTH_SECRET
Name: BETTER_AUTH_SECRET
Value: kv06b8ODY0KuFa5k7JfzBC1mDUEQwd
Env: Production, Preview, Development

# 3. BETTER_AUTH_URL
Name: BETTER_AUTH_URL
Value for Production: https://badekshop.vercel.app
Value for Preview/Development: http://localhost:3000

# 4. MIDTRANS_SERVER_KEY
Name: MIDTRANS_SERVER_KEY
Value: SB-Mid-server-Hc4J4ZVaA-SR_xK00KzgBBZg
Env: Production, Preview, Development

# 5. MIDTRANS_CLIENT_KEY
Name: MIDTRANS_CLIENT_KEY
Value: SB-Mid-client-L4o7Zas3m95PJ2ck
Env: Production, Preview, Development

# 6. MIDTRANS_MODE
Name: MIDTRANS_MODE
Value: sandbox
Env: Production, Preview, Development

# 7. CLOUDINARY_CLOUD_NAME
Name: CLOUDINARY_CLOUD_NAME
Value: badekshop
Env: Production, Preview, Development

# 8. CLOUDINARY_API_KEY
Name: CLOUDINARY_API_KEY
Value: 174635284156651
Env: Production, Preview, Development

# 9. CLOUDINARY_API_SECRET
Name: CLOUDINARY_API_SECRET
Value: WDoCnaTYcpZmb80vXgOeW12U4a0
Env: Production, Preview, Development

# 10. RESEND_API_KEY
Name: RESEND_API_KEY
Value: re_ZJ1rSzbA_5R2FuzgVQTfy8ZBJo7
Env: Production, Preview, Development

# 11. NEXT_PUBLIC_APP_URL
Name: NEXT_PUBLIC_APP_URL
Value for Production: https://badekshop.vercel.app
Value for Preview/Development: http://localhost:3000
```

### Optional (Copy If You Have Them)

```bash
# 12. KV_URL (for rate limiting)
Name: KV_URL
Value: (if you have it, copy from .env.local)
Env: Production, Preview, Development

# 13. KV_REST_API_URL
Name: KV_REST_API_URL
Value: (if you have it, copy from .env.local)
Env: Production, Preview, Development

# 14. KV_REST_API_TOKEN
Name: KV_REST_API_TOKEN
Value: (if you have it, copy from .env.local)
Env: Production, Preview, Development
```

---

## 🎯 How to Add Each Variable in Vercel

For **each** variable, follow these steps:

### Step-by-Step Instructions

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Log in if needed
   - Click on your `badekshop` project

2. **Navigate to Settings**
   - Click **Settings** tab at top
   - Click **Environment Variables** in left sidebar

3. **Add Variable**
   - Enter **Name**: (e.g., `DATABASE_URL`)
   - Enter **Value**: (copy from above)
   - Select **Environments**: Check ✅ Production, Preview, Development
   - Click **Add**

4. **Repeat for All 11 Required Variables**

---

## 📝 Quick Copy List (For Easy Reference)

### Copy-Paste Ready Format

```
DATABASE_URL=postgresql://neondb_owner:npg_Nywz40BXKTuk@ep-frosty-mode-a7clcor8-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
BETTER_AUTH_SECRET=kv06b8ODY0KuFa5k7JfzBC1mDUEQwd
BETTER_AUTH_URL=https://badekshop.vercel.app
MIDTRANS_SERVER_KEY=SB-Mid-server-Hc4J4ZVaA-SR_xK00KzgBBZg
MIDTRANS_CLIENT_KEY=SB-Mid-client-L4o7Zas3m95PJ2ck
MIDTRANS_MODE=sandbox
CLOUDINARY_CLOUD_NAME=badekshop
CLOUDINARY_API_KEY=174635284156651
CLOUDINARY_API_SECRET=WDoCnaTYcpZmb80vXgOeW12U4a0
RESEND_API_KEY=re_ZJ1rSzbA_5R2FuzgVQTfy8ZBJo7
NEXT_PUBLIC_APP_URL=https://badekshop.vercel.app
```

---

## 🔄 After Adding Variables

### Redeploy Your Project

**Option 1: Via Vercel Dashboard**
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**

**Option 2: Via Git Push**
```bash
git commit --allow-empty -m "trigger redeploy after env vars added"
git push
```

---

## ✅ Verify It Worked

### 1. Check API Endpoint

Visit: `https://badekshop.vercel.app/api/products?active=true`

**Expected Result:**
```json
{
  "success": true,
  "products": [...]
}
```

**If you see:**
- `{"success": false, "error": "Database not connected"}` → Add DATABASE_URL
- `{"success": false, "error": "Payment gateway configuration error"}` → Add MIDTRANS keys
- 500 Internal Server Error → Check Vercel logs

### 2. Check Vercel Logs

1. Go to Vercel Dashboard
2. Click on latest deployment
3. Go to **Functions** tab
4. Look for your API calls
5. Should show `[Midtrans] Creating transaction...` or success messages

### 3. Test Payment Flow

1. Go to your site: https://badekshop.vercel.app
2. Add product to checkout
3. Fill form and click "Pay"
4. Should redirect to Midtrans payment page

---

## 🚨 Common Issues

### Issue 1: Still Getting 500 After Adding Variables
**Solution:** Redeploy your Vercel project

### Issue 2: "Database not connected"
**Solution:** Verify DATABASE_URL is correct (copy exactly from .env.local)

### Issue 3: Payment still fails
**Solution:** Check Vercel function logs for specific error message

### Issue 4: Authentication not working
**Solution:** Make sure BETTER_AUTH_URL is `https://badekshop.vercel.app` (not localhost!)

---

## 📞 Need More Help?

Run the checker again:
```bash
npx tsx scripts/show-env-vars.ts
```

Or check variables:
```bash
./scripts/check-env-vars.sh
```

---

## ⏱️ Time Estimate

- Adding 11 variables: ~5 minutes
- Redeploying: ~2 minutes
- Testing: ~2 minutes
- **Total: ~10 minutes**