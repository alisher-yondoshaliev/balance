# 🔄 SUPERADMIN ROLLBACK PLAN - FILE BY FILE

## 📋 CURRENT STATE ANALYSIS

### ✅ DETECTED CHANGES (Qo'shilgan/O'zgartirilgan)

```
1. ✅ auth.controller.ts
   - @Get('me') endpoint QOSHILGAN ← OLIB TASHLASH KERAK

2. ✅ auth.service.ts
   - getMe(userId) method QOSHILGAN ← OLIB TASHLASH KERAK
   - login() method MODIFIED (superadmin response)

3. ✅ auth/dto/auth-me.response.ts
   - SuperAdminMeResponse DTO ← DELETE FILE
   - UserMeResponse DTO ← DELETE FILE

4. ✅ markets.controller.ts
   - @Get('all') endpoint QOSHILGAN ← OLIB TASHLASH KERAK
   - @Patch(':id/status') endpoint MODIFIED ← ROLLBACK

5. ✅ markets.service.ts
   - findAll() method QOSHILGAN ← OLIB TASHLASH KERAK
   - findOne() method MODIFIED ← ROLLBACK
   - updateStatus() method QOSHILGAN ← OLIB TASHLASH KERAK

6. ❓ markets.controller.ts
   - findOne() parameter - MODIFIED ← CHECK & ROLLBACK
```

---

## 🎯 ROLLBACK STRATEGIYASI

### Risk Level: **MINIMAL** 🟢
- Faqat qo'shimcha code'ni olib tashlash
- Old stable logic saqlanib qoladi
- Schema/Migration'da o'zgarish YOQ (schema.prisma intact)

### Method: **CODE-ONLY ROLLBACK**
- Database unchanged
- Just remove extra implementations
- Revert modified methods to original

---

## 📝 STEP-BY-STEP ROLLBACK PLAN

### **STEP 1️⃣ : auth.controller.ts**

**Action: Remove @Get('me') endpoint**

```typescript
// ❌ DELETE THIS ENTIRE BLOCK:
@Get('me')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth('access-token')
@ApiOperation({ summary: "Joriy foydalanuvchi ma'lumotlari" })
getMe(@CurrentUser('id') userId: string) {
  return this.authService.getMe(userId);
}
```

**Status:** Simple deletion, no replacement

---

### **STEP 2️⃣ : auth.service.ts**

**Action: Remove entire getMe() method**

```typescript
// ❌ DELETE THIS:
async getMe(userId: string): Promise<SuperAdminMeResponse | UserMeResponse> {
  // ... entire implementation
}
```

**Action: REVERT login() method to simple return**

Current (MODIFIED):
```typescript
async login(dto: LoginDto) {
  // ... superadmin conditional response logic
  if (user.role === 'SUPERADMIN') {
    return { /* no marketId */ }
  } else {
    return { /* with marketId */ }
  }
}
```

Rollback to (SIMPLE):
```typescript
async login(dto: LoginDto) {
  // ... validation
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      marketId: user.marketId,  // Always include
    }
  }
}
```

---

### **STEP 3️⃣ : auth/dto/ folder**

**Action: DELETE auth-me.response.ts** (if exists)

```bash
rm src/modules/auth/dto/auth-me.response.ts
```

**If imported elsewhere**, remove imports:
```typescript
// ❌ REMOVE THIS LINE FROM auth.service.ts:
import { SuperAdminMeResponse, UserMeResponse } from './dto/auth-me.response';
```

---

### **STEP 4️⃣ : markets.controller.ts**

**Action 1: Remove @Get('all') endpoint**

```typescript
// ❌ DELETE:
@Get('all')
@UseGuards(RolesGuard)
@Roles(Role.SUPERADMIN)
@ApiOperation({ summary: "Barcha do'konlarni ko'rish (SUPERADMIN)" })
@ApiResponse({
  status: 200,
  description: "Tizimning barcha do'konlari",
})
findAll() {
  return this.marketsService.findAll();
}
```

**Action 2: Remove @Patch(':id/status') endpoint**

```typescript
// ❌ DELETE:
@Patch(':id/status')
@UseGuards(RolesGuard)
@Roles(Role.SUPERADMIN)
@ApiOperation({
  summary: "Do'kon holatini o'zgartirish (SUPERADMIN)",
})
@ApiResponse({
  status: 200,
  description: 'Do'kon holati yangilandi',
})
updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateMarketStatusDto,
) {
  return this.marketsService.updateStatus(id, dto.status);
}
```

**Action 3: REVERT findOne() method signature**

Current (MODIFIED):
```typescript
@Get(':id')
@ApiOperation({ summary: "Bitta do'kon (OWNER o'z, SUPERADMIN hammasi)" })
findOne(@Param('id') id: string, @CurrentUser() user: User) {
  return this.marketsService.findOne(id, user);
}
```

Rollback to (SIMPLE):
```typescript
@Get(':id')
@ApiOperation({ summary: "Do'kon bilan tanishish" })
findOne(@Param('id') id: string) {
  return this.marketsService.findOne(id);
}
```

---

### **STEP 5️⃣ : markets.service.ts**

**Action 1: Remove findAll() method**

```typescript
// ❌ DELETE:
async findAll() {
  return await this.prisma.market.findMany({
    include: {
      owner: { ... },
      _count: { ... },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

**Action 2: Remove updateStatus() method**

```typescript
// ❌ DELETE:
async updateStatus(id: string, status: MarketStatus) {
  return await this.prisma.market.update({
    where: { id },
    data: { status },
  });
}
```

**Action 3: REVERT findOne() method**

Current (MODIFIED - with permission check):
```typescript
async findOne(id: string, user: User) {
  const market = await this.prisma.market.findUnique({
    where: { id },
    include: {
      owner: {
        select: { /* ... */ },
      },
    },
  });
  
  // Complex permission logic (SUPERADMIN specific)
  if (user.role === 'SUPERADMIN') {
    return market;
  } else if (user.role === 'OWNER') {
    // check ownership
  } else {
    // check market assignment
  }
}
```

Rollback to (SIMPLE):
```typescript
async findOne(id: string) {
  return await this.prisma.market.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}
```

---

### **STEP 6️⃣ : Check Imports & Dependencies**

**Files to update imports:**

1. **auth.controller.ts**
   ```typescript
   // Remove if added:
   // import { CurrentUser } from '../../common/decorators/current-user.decorator';
   ```

2. **markets.controller.ts**
   ```typescript
   // Remove if added:
   // import { UpdateMarketStatusDto } from './dto/update-status.dto';
   // import { Role } from '@prisma/client';
   ```

3. **markets.service.ts**
   ```typescript
   // Remove if added:
   // import { MarketStatus } from '@prisma/client';
   ```

---

## ✅ VERIFICATION CHECKLIST

After rollback complete:

- [ ] `src/modules/auth/auth.controller.ts` - No @Get('me') endpoint
- [ ] `src/modules/auth/auth.service.ts` - No getMe() method, simple login()
- [ ] `src/modules/auth/dto/auth-me.response.ts` - FILE DELETED
- [ ] `src/modules/markets/markets.controller.ts` - No @Get('all'), no @Patch(':id/status')
- [ ] `src/modules/markets/markets.service.ts` - No findAll(), no updateStatus(), simple findOne()
- [ ] No import errors in IDE
- [ ] `npm run build` succeeds
- [ ] Existing endpoints work (POST create, GET own markets)

---

## 🚀 EXECUTION ORDER

1. Delete file: `auth-me.response.ts`
2. Modify: `auth.controller.ts` (remove @Get('me'))
3. Modify: `auth.service.ts` (remove getMe, revert login)
4. Modify: `markets.controller.ts` (remove 2 endpoints, revert findOne)
5. Modify: `markets.service.ts` (remove 2 methods, revert findOne)
6. Run: `npm run build`
7. Test: Existing endpoints work (create market, get own markets, login)

---

## 🎁 WHAT REMAINS (STABLE)

```
✅ POST   /auth/send-otp        - Register OTP
✅ POST   /auth/verify-otp      - Verify OTP
✅ POST   /auth/register        - User register
✅ POST   /auth/login           - User login (SIMPLE - no role-based response)
✅ POST   /auth/refresh         - Token refresh
✅ GET    /auth/google          - Google OAuth
✅ GET    /auth/google/callback - Google callback
✅ PATCH  /auth/change-password - Change password

✅ POST   /markets             - Create market (OWNER)
✅ GET    /markets             - Get own markets (OWNER)
✅ GET    /markets/:id         - Get single market
✅ PATCH  /markets/:id         - Update market (OWNER)
✅ DELETE /markets/:id         - Delete market (OWNER)

❌ GET    /markets/all         - REMOVED (SUPERADMIN endpoint)
❌ PATCH  /markets/:id/status  - REMOVED (SUPERADMIN endpoint)
❌ GET    /auth/me             - REMOVED
```

---

## 🔒 SECURITY NOTES

- SUPERADMIN role ta'rifi `@Prisma` schemada REMAINS
- User database'da role='SUPERADMIN' qoladi
- Faqat SUPERADMIN endpoints'ni o'chirdik, user data intact
- Future: SUPERADMIN functionality keyinroq qayta qo'shiladi

---

## 📞 ROLLBACK SUCCESS INDICATORS

✅ **Build Success:**
```bash
npm run build
# No errors, clean compilation
```

✅ **Existing Endpoints Work:**
```bash
POST /auth/login → { accessToken, refreshToken, user: { id, email, role, marketId } }
POST /markets → Market created
GET /markets → My markets list
```

✅ **New Endpoints Gone:**
```bash
GET  /markets/all        → 404 Not Found
PATCH /markets/:id/status → 404 Not Found
GET /auth/me             → 404 Not Found
```

---

Last Updated: April 7, 2026
SUPERADMIN Rollback Plan - Ready for Execution
