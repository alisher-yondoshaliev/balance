# 🚀 BALANCE API - PORT 3000 XATOSI TEZKOR YECHIM

## 🎯 MUAMMOSI?
```
Error: listen EADDRINUSE: address already in use :::3000
```

---

## ⚡ TEZKOR YECHIM (30 SEKUND)

### **Windows Command Prompt:**
```bash
# 1. Port band qilgan processni o'chirish
netstat -ano | findstr :3000

# 2. Chiqayotgan PID raqamni nusxa oling (misol: 12345)
taskkill /PID 12345 /F

# 3. Serverni qayta ishga tushirish
npm run start:dev
```

### **Windows PowerShell (Qulay):**
```powershell
# Script ishga tushirish
powershell -ExecutionPolicy Bypass -File .\fix-port.ps1

# Yoki qo'lda
$pids = (netstat -ano | Select-String ":3000").ToString() -split '\s+' | Select-Object -Last 1
taskkill /PID $pids /F
npm run start:dev
```

### **Batch Script (Fastest):**
```bash
# Faylni ishga tushirish
fix-port.bat
```

---

## 📚 AVAILABLE SOLUTIONS

| Yechim | Vaqt | Qiynchiligi | To'g'riligi |
|--------|------|---------|----------|
| `fix-port.bat` | 10 miya | Oson | Eng chiqin ✅ |
| `fix-port.ps1` | 15 miya | O'rta | Chiqin |
| Manual netstat+taskkill | 30 miya | O'rta | Chiqin |
| Dynamic main.ts | 1 miya | Oson | BEST ✅✅✅ |

---

## 🎁 YA'NI?

✅ **Qo'rkazip qo'yilgan (Updated) main.ts:**
- Portni environmentdan oqish
- Band bo'lsa avtomatik keyingi portga o'tish
- Beautiful logging
- Production-ready

✅ **Yaratilgan Scripts:**
- `fix-port.bat` - Batch script
- `fix-port.ps1` - PowerShell script
- `.env.development` - Environment variables

✅ **Yaratilgan Documents:**
- `PORT_SOLUTION_GUIDE.md` - Full guide
- `PORT_QUICK_SOLUTION.md` - This file
- `.env.development` - Development config

---

## 🔄 HAMISHA ISHLAYDI (RECOMMENDED)

**Hozir updated main.ts** qo'shildi:

```typescript
// Port band bo'lsa, avtomatik o'tadi:
// 3000 band  → 4000 sinash
// 4000 band  → 5000 sinash
// 5000 band  → 6000 sinash
// va hakazo...

const port = await findAvailablePort(defaultPort);
```

**Demak:**
```bash
npm run start:dev
# Avtomatik ishladi, hech yo'q! 🚀
```

---

## 🧹 KOMPLEKS YECHIM (Agar hali ham band bo'lsa)

```bash
# Barcha Node.js processlarini o'chirish
taskkill /IM node.exe /F

# Yoki PowerShell bilan
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 📋 ENVIRONMENT VARIABLES

`.env.development` faylida:
```env
PORT=3000          # Band bo'lsa 4000, 5000... ga o'tadi
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## 🎮 DEVELOPMENT WORKFLOW

```bash
# Terminal 1 - Backend
npm run start:dev
# ✅ Output: Server ishlamoqda http://localhost:3000/api

# Terminal 2 - Frontend (Vite)
npm run dev:frontend
# ✅ Output: http://localhost:5173

# Terminal 3 - Monitoring (Optional)
netstat -ano | findstr LISTENING | findstr node
```

---

## 🆘 FAQs

**Q: Hali ham band deya chiqyapti?**
A: `taskkill /IM node.exe /F` bilan barcha Node processlarini o'chiring

**Q: Qanday port band qilgan bilaman?**
A: `netstat -ano | findstr :3000` → chiqayotgan PID ni o'chiring

**Q: Environment uchun qanday set qilam?**
A: Main.ts avtomatik oqiydi yoki `.env` faylida `PORT=3001` yozing

**Q: Production da nima qilam?**
A: PM2 yoki Docker bilan, graceful shutdown sozlang

---

## 📦 NEXT STEPS (Optional)

```bash
# PM2 bilan monitoring
npm install -g pm2

pm2 start "npm run start:dev" --name "balance-api"
pm2 logs balance-api

# Server tog'ri ishlanadgan?
curl http://localhost:3000/api/docs
```

---

## ✨ XULOSA

1. **Main.ts updated** - Avtomatik port fallback qo'shildi ✅
2. **Scripts created** - `fix-port.bat` va `fix-port.ps1` ✅
3. **Docs created** - Full guide va quick solution ✅
4. **Production ready** - Graceful shutdown + error handling ✅

**Endi barcha port muammolari hal! 🎉**

