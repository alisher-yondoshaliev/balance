# 🔍 GOOGLE OAUTH - DEBUGGING GUIDE

## 🧪 TEST STEPS

### Step 1: Backend Ishga Tushirish
```bash
cd c:\Users\alish\Desktop\balance
npm run start:dev

# Expected output:
# ✅ Server ishlamoqda http://localhost:3000/api
# ✅ Swagger API: http://localhost:3000/api/docs
```

---

### Step 2: Frontend Ishga Tushirish

**Alohida terminal'da:**
```bash
cd c:\Users\alish\Desktop\balance\frontend  # yoki qayerda bo'lsa
npm run dev

# Expected output:
# ✅ Vite dev server running at: http://localhost:5173
```

---

### Step 3: Browser'da Test Qilish

1. **Browser'ni aching:**
   ```
   http://localhost:5173
   ```

2. **DevTools aching:**
   ```
   F12 yoki Ctrl+Shift+I
   ```

3. **Tabs'ni setup qiling:**
   - **Console** tab - Errors/logs uchun
   - **Network** tab - Request/response uchun
   - **Application** tab - Tokens uchun

4. **Google Login button bosing:**
   ```
   Login page'da "Google Login" knopkasini bosing
   ```

---

## 🔍 WHAT TO CHECK

### 1️⃣ FINAL URL (Address Bar)

**Expected:**
```
http://localhost:5173/auth/google/callback
?accessToken=eyJhbGciOiJIUzI1NiIs...
&refreshToken=eyJhbGciOiJIUzI1NiIs...
&user=%7B%22id%22%3A%22...%22%7D
```

**Or Simple (with error):**
```
http://localhost:5173/login
# (hech o'zgarish yo'q = error)
```

**Screenshot aloqa:**
```
Address bar'dan URL'ni copy-paste qiling va yetkazib ering ⬇️
```

---

### 2️⃣ CONSOLE TAB

**F12 → Console → Paste quyidagini:**

```javascript
// Copy qiling va console'ga paste qiling:
console.log('Current URL:', window.location.href);
console.log('Query params:', window.location.search);
console.log('Tokens:', localStorage.getItem('accessToken'));
```

**Expected Output:**
```
Current URL: http://localhost:5173/auth/google/callback?accessToken=...
Query params: ?accessToken=...&refreshToken=...&user=...
Tokens: eyJhbGciOiJIUzI1NiIs...
```

**Or errors:**
```
ERROR: undefined is not an object
ERROR: CORS error
ERROR: 401 Unauthorized
```

**Screenshot aloqa:**
```
Console'dagi complete text'ni copy-paste qiling ⬇️
```

---

### 3️⃣ NETWORK TAB

**Steps:**
1. **Network tab'ni aching** (F12 → Network)
2. **Clear qiling** (Trash icon)
3. **Google Login button bosing**
4. **Kesish:**
   - `google` (yoki `auth` bilan boshlanuvchi)
   - `callback`

**Har bir request uchun check qiling:**

```
Request Name: 
  ├─ URL: ?
  ├─ Status: ? (200, 301, 404, 500, 401)
  ├─ Type: ? (document, xhr, fetch)
  ├─ Headers vs Response ?
  └─ Time: ? ms
```

**Screenshot example:**
```
Name                    Status  Type      Size      Time
google                  301     document  4.2 kB    120 ms
google/callback?code=   200     document  8.5 kB    180 ms
```

**Screenshot aloqa:**
```
Network tab'dagi request list'ni copy qiling
Status column visible bo'lishi kerak ⬇️
```

---

## 📋 CHECKLIST - QAZI QILISH UCHUN

```
□ Backend running: npm run start:dev
□ Frontend running: npm run dev
□ Browser: http://localhost:5173
□ DevTools: F12 (open)

□ See "Google Login" button
□ Button bosgandan keyin redirection bo'ladimi?
  
□ Final URL nima?
  - With tokens? → http://localhost:5173/auth/google/callback?accessToken=...
  - Without tokens? → http://localhost:5173/login (or other page)

□ Console tab'da qanday message?
  - Success logs?
  - Errors?
  
□ Network tab'da callback request status?
  - 200 OK?
  - 301/302 Redirect?
  - 404 Not Found?
  - 500 Server Error?
  - 401 Unauthorized?

□ Console'da tokens visible?
  - localStorage.getItem('accessToken')
  - Can see user data?
```

---

## 🚀 TEST EXECUTION

### Run qilish uchun:

**Terminal 1 - Backend:**
```bash
cd c:\Users\alish\Desktop\balance
npm run start:dev
# Leave running
```

**Terminal 2 - Frontend:**
```bash
cd [FRONTEND PATH]
npm run dev
# Leave running
```

**Terminal 3 - Logs Monitor (Optional):**
```bash
# Backend logs watch qilish
tail -f backend.log

# Or just check if stderr visible in main terminal
```

---

## 📸 RESULTS SEND QIL

**Following information'ni yetkazib ering:**

### 1. Final URL
```
Copy qiling address bar'dan va yetkazib ering:
http://localhost:5173/auth/google/callback?...
yoki
http://localhost:5173/login
```

### 2. Console Output
```javascript
// Run qiling console'da:
console.log('URL:', window.location.href);
console.log('Search:', window.location.search);
console.log('Token in LS:', localStorage.getItem('accessToken') ? 'YES' : 'NO');

// Screenshot yoki text'ni yetkazib ering
```

### 3. Network Tab Screenshot
```
DevTools → Network → Google button bosing → Request list screenshot
Status column clearly visible should be
```

### 4. Console Tab Screenshot
```
DevTools → Console → Any errors or logs visible?
Screenshot yoki text
```

### 5. Backend Terminal Output
```
npm run start:dev output'dagi logs
First few lines + Google OAuth related logs
```

---

## 🔧 COMMON ISSUES & CHECKS

| Issue | Check |
|-------|-------|
| "Google button not visible" | Frontend running? Check browser console for JS errors |
| "URL stays at /login" | Backend /api/auth/google 404? Network tab check |
| "URL has no tokens" | Backend callback not sending tokens? Check response |
| "CORS error" | Backend CORS disabled? Check main.ts enableCors() |
| "Google consent error" | Credentials wrong? Check .env GOOGLE_CLIENT_ID |
| "Tokens undefined in LS" | Frontend not saving? Check LocalStorage logic |

---

## 📊 EXPECTED FULL FLOW

```
1. "Google Login" button click
   ↓ (Frontend button click handler triggers)
   
2. Redirects to: http://localhost:3000/api/auth/google
   ↓ (Network tab: GET request)
   
3. GoogleGuard triggers, redirects to Google OAuth
   ↓ (Status: 301/302 Redirect)
   
4. Google consent screen (browser opens)
   ↓ (User clicks "Allow")
   
5. Google redirects back to callback
   ↓ http://localhost:3000/api/auth/google/callback?code=...&state=...
   
6. Backend validates, creates user, generates tokens
   ↓ (Network tab: GET request, Status: 200)
   
7. Backend redirects to frontend with tokens
   ↓ http://localhost:5173/auth/google/callback?accessToken=...&refreshToken=...
   
8. Frontend console shows tokens loaded
   ↓ localStorage has tokens
   
9. Frontend redirects to dashboard
   ↓ http://localhost:5173/dashboard (or home)
```

---

## 💾 INFORMATION TO COLLECT

**Once you run the test, collect:**

1. **Final URL in address bar** (screenshot or text)
2. **Console output** (screenshot or copy-paste)
3. **Network tab requests** (screenshot with Status visible)
4. **Any error messages** (red text in console)
5. **Backend terminal output** (any logs related to auth/google)

---

**THEN REPLY WITH THESE DETAILS AND I'LL FIX ANY ISSUES! 🚀**

---

## ⚡ QUICK TEMPLATE TO SEND BACK

```
GOOGLE OAUTH TEST RESULTS:
========================

Final URL:
[Paste address bar content]

Console Output:
[Paste console.log results or error messages]

Network Tab Status:
[Example: GET /api/auth/google → 301 Redirect
          GET /api/auth/google/callback → 200 OK]

Errors/Warnings:
[Any red text in console?]

Backend Logs:
[Related logs from "npm run start:dev"]

Screenshots:
[Attach if possible]
```

---

**Remember: Test thoroughly and send detailed info = Fastest fix! ✨**
