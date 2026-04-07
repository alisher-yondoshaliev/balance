# 🚀 EADDRINUSE Port 3000 Xato - TO'LIQ YECHIM

## 📌 1. XATO NIMANI ANGLATADI?

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Maʼnosi:**
- `::: 3000` = IPv6 da 3000-port
- `EADDRINUSE` = Ushbu port faqat bitta application ishlatishi mumkin
- **Sababi:** Server oldingi instance hali yopilmagan yoki boshqa process band qilgan

---

## 🪟 2. WINDOWS DA YECHIM (PRIMARY METHOD)

### **A. Portni Band Qilgan Process ni Topish**

```bash
netstat -ano | findstr :3000
```

**Output misoli:**
```
TCP    [::]:3000    [::]:0    LISTENING    12345
```

PID = `12345`

### **B. Process ni O'chirish**

```bash
# Biriktirilgan processni o'chirish
taskkill /PID 12345 /F

# Yoki barcha Node.js processlarini o'chirish
taskkill /IM node.exe /F
```

### **C. PowerShell da Qulay Funksiya**

```powershell
# Add to your PowerShell profile
function Kill-Port {
    param([int]$port)
    $process = netstat -ano | findstr ":$port" | findstr "LISTENING" | ForEach-Object {
        $_ -split '\s+' | Select-Object -Last 1
    }
    if ($process) {
        taskkill /PID $process /F
        Write-Host "✅ Port $port ochildi (PID: $process)"
    } else {
        Write-Host "❌ Port $port band qilgan process topilmadi"
    }
}

# Ishlatish: Kill-Port -port 3000
```

---

## 🍎 3. MAC/LINUX DA YECHIM

### **A. Portni Band Qilgan Process ni Topish**

```bash
lsof -i :3000
```

**Output misoli:**
```
COMMAND    PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node      1234    user   21u  IPv6  0x12345      0t0  TCP *:3000 (LISTEN)
```

### **B. Process ni O'chirish**

```bash
# Graceful shutdown (tavsiya etilgan)
kill -15 1234

# Yoki kuchli o'chirish
kill -9 1234

# Yoki to'g'ridan-to'g'ri
kill $(lsof -t -i :3000)
```

### **C. Bash da Qulay Funksiya**

```bash
# Add to ~/.bashrc or ~/.zshrc
kill-port() {
    local port=$1
    local pids=$(lsof -t -i :$port)
    if [ -z "$pids" ]; then
        echo "❌ Port $port band qilgan process topilmadi"
    else
        echo "Killing processes on port $port: $pids"
        kill -9 $pids
        echo "✅ Port $port ochildi"
    fi
}

# Ishlatish: kill-port 3000
```

---

## 4. ENVIRONMENT VARIABLES BIlan PORT BOSHQARISH

### **A. .env fayliga qo'shish**

```env
# .env yoki .env.development
PORT=3000

# Production uchun
NODE_ENV=development

# Frontend CORS uchun
FRONTEND_URL=http://localhost:5173
```

### **B. package.json bilan**

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "PORT=3000 nest start --watch",
    "start:prod": "PORT=5000 nest start",
    "start:debug": "PORT=3001 nest start --debug --watch",
    "kill:port": "taskkill /IM node.exe /F"
  }
}
```

---

## ✅ 5. IMPROVED MAIN.TS (DYNAMIC PORT)

Ko'rkazip qo'yilgan **main.ts** quyidagi xususiyatlarga ega:

### **Asosiy Features:**
- ✅ Portni environment orqali topish
- ✅ Band bo'lsa, avtomatik keyingi portga o'tish
- ✅ Beautiful logging
- ✅ Smart error handling
- ✅ Development va Production da ishlashi

### **Qanday ishlaydi:**

```typescript
// 1. Default port 3000 ni birinchi sinash
const defaultPort = parseInt(process.env.PORT ?? '3000', 10);

// 2. Port band bo'lsa, 4000, 5000, 6000... ni sinash
const port = await findAvailablePort(defaultPort);

// 3. Server ushbu portda ishga tushishi
await app.listen(port);
logger.log(`✅ Server ishlamoqda http://localhost:${port}/api`);
```

---

## 🚀 6. PORT SEQUENCE (Development Best Practice)

Recommended port taqsimlash:

```
Backend:    3000, 4000, 5000 (Fallback)
Frontend:   5173, 5174, 5175 (Vite Dev Server)
MongoDB:    27017
Redis:      6379
Swagger:    3000/api/docs
```

### **Docker Compose bilan**

```yaml
version: '3'
services:
  backend:
    build: .
    environment:
      - PORT=3000
      - NODE_ENV=development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    command: npm run start:dev

  frontend:
    image: nginx:alpine
    ports:
      - "5173:80"
    volumes:
      - ./dist:/usr/share/nginx/html
```

---

## 🛠️ 7. TROUBLESHOOTING CHECKLIST

### Server ishlamaydi
- [ ] Port band qilgan process o'chirilgan
- [ ] Node.js qayta o'rnatilgan
- [ ] `npm run build` bajarilgan
- [ ] .env faylida PORT to'g'ri yozilgan

### Port hali ham band
```bash
# Butun barcha Node processlarini o'chirish (XAVFLI!)
taskkill /IM node.exe /F

# Yoki port-specific
netstat -ano | findstr :3000 | findstr LISTENING
```

### PM2 bilan ism tayyorlash
```bash
npm install -g pm2

# Restart bilan
pm2 start "npm run start:dev" --name "balance-api" --restart-delay 1000

# Logs ko'rish
pm2 logs balance-api

# O'chirish
pm2 delete balance-api
```

---

## 🎯 8. DEVELOPMENT WORKFLOW (WINDOWS)

### **Option 1: Avtomatik Solution (Recommended)**

```bash
# 1. Ushbu main.ts ishlati (ko'rkazip qo'yilgan)
npm run start:dev

# Server avtomatik available port topib ishga tushadi
# Masalan:
# Port 3000 band  ❌
# Port 4000 ochiq ✅ -> http://localhost:4000/api
```

### **Option 2: Manual Backup**

```bash
# Port band bo'lsa:
netstat -ano | findstr :3000

# Process o'chirish:
taskkill /PID 12345 /F

# Restart:
npm run start:dev
```

### **Option 3: Environment Specific**

```bash
# Different terminals
# Terminal 1 - Backend port 3000
npm run start:dev

# Terminal 2 - Frontend port 5173
npm run dev:frontend

# Terminal 3 - Monitoring
netstat -ano | findstr LISTENING | findstr node
```

---

## 📋 9. PRODUCTION BEST PRACTICES

### **Environment Variables (.env.production)**

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=error
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
```

### **Docker Production**

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### **PM2 Ecosystem**

```bash
# ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'balance-api',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js
```

---

## 🔒 10. XATO QAYTA CHIQMASLIGI UCHUN BEST PRACTICES

### **1. Graceful Shutdown**

```typescript
// main.ts da qo'shish
process.on('SIGTERM', async () => {
  logger.log('SIGTERM signal received');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.log('SIGINT signal received');
  await app.close();
  process.exit(0);
});
```

### **2. Proper Cleanup**

```bash
# Package.json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "stop": "taskkill /IM node.exe /F",
    "restart": "npm run stop && npm run start:dev"
  }
}
```

### **3. Development Best Practices**

```
✅ DO:
- Environment variables ishlatish
- Graceful shutdown haytqazish
- Process logs monitoring qilish
- Different terminal da backend/frontend ishlatish
- Development uchun 3000, Production uchun 5000

❌ DON'T:
- Hardcoded port ishlatish
- Process without shutdown handling
- Random portlarni sinash
- Multiple instances same port da
```

### **4. Monitoring Script (Windows)**

```batch
@echo off
REM bin/monitor.bat

echo Checking port 3000...
netstat -ano | findstr :3000

if %errorlevel% == 0 (
    echo ✅ Port 3000 ochiq
) else (
    echo ❌ Port 3000 band
    echo Killing process...
    taskkill /IM node.exe /F
    echo Restarting server...
    npm run start:dev
)
```

---

## 📚 QUICK REFERENCE

| Vazifa | Windows | Mac/Linux |
|--------|---------|----------|
| Port topish | `netstat -ano \| findstr :3000` | `lsof -i :3000` |
| Process o'chirish | `taskkill /PID 1234 /F` | `kill -9 1234` |
| Barcha node o'chirish | `taskkill /IM node.exe /F` | `pkill node` |
| Port ochiqligini tekshirish | `netstat -ano` | `lsof -i` |

---

## ✅ XULOSA

**Eng qulay yechim:**

1. **CURRENT MAIN.TS** - Avtomatik port fallback ✅ (Ko'rkazip qo'yilgan)
2. **Port band bo'lsa:** `netstat -ano | findstr :3000` → `taskkill /PID 1234 /F`
3. **Environment:** `.env` faylida `PORT=3000` yozing
4. **Monitoring:** PM2 yoki script bilan monitor qiling
5. **Production:** Graceful shutdown va error handling

Endi barcha portli xatolar hal qilindi! 🎉

