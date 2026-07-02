# Lumen E-Commerce Platform

A full-featured, bilingual (English/French) e-commerce platform built with **Laravel 12** (API backend) and **Next.js 16** (React frontend). The platform supports multi-currency, guest checkout, coupon management, invoice tracking, PayPal integration, two-factor authentication, refund management, and a comprehensive admin dashboard.

---

## Tech Stack

### Backend — `ecommerce-api/`

| Layer          | Technology                                                              |
|----------------|-------------------------------------------------------------------------|
| Framework      | Laravel 12                                                              |
| Auth           | Laravel Sanctum (token-based API auth) + 2FA (google2fa)                |
| Database       | MySQL / MariaDB / SQLite                                                |
| PDF Generation | barryvdh/laravel-dompdf                                                 |
| Payments       | PayPal REST API (sandbox/live)                                          |
| Queue          | Database-driven queue                                                   |
| Cache          | Database / Redis                                                        |
| Mail           | Laravel Mail (log, SMTP, or any Laravel-supported driver)               |

### Frontend — `ecommerce-app/`

| Layer          | Technology                                    |
|----------------|-----------------------------------------------|
| Framework      | Next.js 16 (App Router)                       |
| Language       | TypeScript 5                                  |
| State          | Redux Toolkit + React Query (TanStack Query)  |
| Styling        | Tailwind CSS v4 + tw-animate-css              |
| Icons          | Lucide React                                  |
| Charts         | Recharts                                      |
| UI Components  | Custom (shadcn/ui style)                      |
| Forms          | Native HTML forms + controlled components     |
| i18n           | next-intl (English, French, Arabic, Spanish)  |
| PDF View       | @react-pdf/renderer                           |
| Theming        | next-themes (dark/light mode)                 |

---

## Project Structure

```
/
├── ecommerce-api/          # Laravel API backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/       # API controllers (customer)
│   │   │   ├── Controllers/Api/Admin/ # Admin-only controllers
│   │   │   ├── Middleware/            # AdminMiddleware
│   │   │   └── Resources/            # API resource transformers
│   │   ├── Mail/                     # Mailables (Invoice, Refund)
│   │   ├── Models/                   # Eloquent models
│   │   └── Services/                 # Business logic (Coupon, PayPal, Refund)
│   ├── config/                       # Laravel configuration
│   ├── database/
│   │   └── migrations/               # 40+ database migrations
│   ├── routes/
│   │   └── api.php                   # All API routes
│   ├── tests/                        # Feature tests
│   └── resources/views/              # Email templates, PDF bladess
│
└── ecommerce-app/          # Next.js frontend
    ├── app/
    │   ├── (public pages)            # cart, categories, checkout, contact, faq,
    │   │                             # orders, payments, products, profile, refunds, wishlist
    │   ├── dashboard/                # Admin dashboard pages
    │   │   ├── brands, carts, categories, coupons, expenses,
    │   │   ├── invoices, orders, payments, products, refunds,
    │   │   ├── settings, users
    │   │   └── page.tsx              # Main dashboard
    │   └── layout.tsx                # Root layout with providers
    ├── components/
    │   ├── dashboard/                # Dashboard chart components
    │   ├── invoice/                  # Invoice PDF component
    │   ├── ui/                       # Reusable UI primitives (button, card, input, etc.)
    │   ├── admin-sidebar.tsx         # Admin navigation sidebar
    │   ├── navbar.tsx                # Storefront navigation
    │   ├── product-card.tsx          # Product display card
    │   ├── order-summary.tsx         # Checkout order summary with coupon
    │   └── site-shell.tsx            # Layout shell for public pages
    ├── lib/
    │   ├── api/
    │   │   ├── client.ts             # Axios instance, interceptors, session management
    │   │   └── services.ts           # All API service functions
    │   ├── hooks/                    # Custom React hooks (use-auth, use-api, etc.)
    │   ├── store/                    # Redux slices (cart, products, orders, coupons, etc.)
    │   ├── currency/                 # Multi-currency context & config
    │   ├── i18n/                     # Internationalization setup
    │   ├── types.ts                  # TypeScript type definitions
    │   └── utils.ts                  # Utility functions (formatPrice, cn, etc.)
    └── messages/                     # i18n translation files (en, fr, ar, es)
```

---

## Quick Start

```bash
# 1. Backend setup
cd ecommerce-api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve

# 2. Frontend setup
cd ecommerce-app
npm install
npm run dev
```

The API runs on `http://localhost:8000` and the frontend on `http://localhost:3000`.

---

## Key Features

- **Multi-language** — English, French, Arabic, Spanish
- **Dark/Light mode** — Persistent theme toggle
- **Guest checkout** — Order without an account (session-based cart)
- **Multi-currency** — Switch between MAD, USD, EUR (frontend display)
- **Two-factor authentication** — TOTP-based 2FA with recovery codes
- **Admin dashboard** — Revenue charts, order tracking, inventory alerts, invoice/payment/coupon/refund stats
- **Invoice system** — Auto-generated invoices, partial payments, PDF download/email
- **Coupon engine** — Percentage/flat discounts, auto-apply, usage limits, product-specific
- **Refund management** — Customer request → Admin approve/reject → Complete flow
- **Wishlist** — Save products for later
- **Product variants** — Size, color, storage attributes with stock tracking
- **PayPal integration** — Sandbox and live modes
- **Expense tracking** — Categorized expense management with reports
- **Cart analytics** — Active, abandoned, converted cart tracking

---

## Documentation

Detailed documentation is available in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [Installation Guide](docs/INSTALLATION.md) | Full setup instructions for dev environments |
| [Deployment Guide](docs/DEPLOYMENT.md) | Production deployment & checklist |
| [Environment Variables](docs/ENVIRONMENT.md) | Complete .env reference |
| [API Reference](docs/API.md) | All API endpoints with request/response examples |
| [Authentication Flow](docs/AUTH.md) | Auth, session, 2FA, and middleware details |
| [Architecture](docs/ARCHITECTURE.md) | Folder structure, database schema, ER diagram |
| [Features](docs/FEATURES.md) | Detailed feature documentation |
| [Security](docs/SECURITY.md) | Security best practices |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Production Checklist](docs/PRODUCTION-CHECKLIST.md) | Go-live readiness checklist |

---

## License

Proprietary — All rights reserved.
