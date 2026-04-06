Barcha Endpointlar
🔐 Auth
POST   /api/auth/send-otp              → Ochiq
POST   /api/auth/verify-otp            → Ochiq
POST   /api/auth/register              → Ochiq
POST   /api/auth/login                 → Ochiq
POST   /api/auth/refresh               → RefreshTokenGuard
GET    /api/auth/me                    → AccessTokenGuard
GET    /api/auth/google                → GoogleGuard
GET    /api/auth/google/callback       → GoogleGuard
PATCH  /api/auth/change-password       → AccessTokenGuard

👤 Users
GET    /api/users                      → AccessTokenGuard + [SUPERADMIN, OWNER]
POST   /api/users                      → AccessTokenGuard + [SUPERADMIN, OWNER]
GET    /api/users/:id                  → AccessTokenGuard + [SUPERADMIN, OWNER]
PATCH  /api/users/:id                  → AccessTokenGuard + [SUPERADMIN, OWNER]
DELETE /api/users/:id                  → AccessTokenGuard + [SUPERADMIN, OWNER]
PATCH  /api/users/:id/status           → AccessTokenGuard + [SUPERADMIN, OWNER]

🏪 Markets
POST   /api/markets                    → AccessTokenGuard + [OWNER]
GET    /api/markets                    → AccessTokenGuard + [OWNER]
GET    /api/markets/all                → AccessTokenGuard + [SUPERADMIN]
GET    /api/markets/:id                → AccessTokenGuard
PATCH  /api/markets/:id                → AccessTokenGuard + [OWNER]
DELETE /api/markets/:id                → AccessTokenGuard + [OWNER]
PATCH  /api/markets/:id/status         → AccessTokenGuard + [SUPERADMIN]

💳 Subscriptions
GET    /api/subscriptions/plans        → Ochiq
GET    /api/subscriptions/plans/:id    → Ochiq
POST   /api/subscriptions/plans        → AccessTokenGuard + [SUPERADMIN]
PATCH  /api/subscriptions/plans/:id    → AccessTokenGuard + [SUPERADMIN]
DELETE /api/subscriptions/plans/:id    → AccessTokenGuard + [SUPERADMIN]
POST   /api/subscriptions/pay          → AccessTokenGuard + [OWNER]
GET    /api/subscriptions/current      → AccessTokenGuard + [OWNER]
GET    /api/subscriptions/history      → AccessTokenGuard + [OWNER]

📦 Categories
GET    /api/categories                 → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER, SELLER]
POST   /api/categories                 → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
GET    /api/categories/:id             → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER, SELLER]
PATCH  /api/categories/:id             → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
DELETE /api/categories/:id             → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]

🛍️ Products
GET    /api/products                   → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER, SELLER]
POST   /api/products                   → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
GET    /api/products/:id               → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER, SELLER]
PATCH  /api/products/:id               → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
PATCH  /api/products/:id/status        → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
DELETE /api/products/:id               → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
POST   /api/products/:id/price-plans   → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
PATCH  /api/products/:id/price-plans/:planId → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
DELETE /api/products/:id/price-plans/:planId → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]

👥 Customers
GET    /api/customers                  → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
POST   /api/customers                  → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
GET    /api/customers/:id              → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
PATCH  /api/customers/:id              → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
DELETE /api/customers/:id              → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
GET    /api/customers/:id/contracts    → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]

📄 Contracts
GET    /api/contracts                  → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
POST   /api/contracts                  → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
GET    /api/contracts/:id              → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
PATCH  /api/contracts/:id              → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
DELETE /api/contracts/:id              → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
PATCH  /api/contracts/:id/status       → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
POST   /api/contracts/:id/pay          → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
GET    /api/contracts/:id/installments → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]

📊 Dashboard
GET    /api/dashboard/summary          → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]
GET    /api/dashboard/revenue          → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
GET    /api/dashboard/top-debtors      → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN]
GET    /api/dashboard/overdue          → AccessTokenGuard + [SUPERADMIN, OWNER, ADMIN, MANAGER]

Jami: 46 ta endpoint
ModulEndpointlar soniAuth9Users6Markets7Subscriptions8Categories5Products9Customers6Contracts8Dashboard4