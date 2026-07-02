# Installation Guide

## Prerequisites

- **PHP** >= 8.2
- **Composer** >= 2.x
- **Node.js** >= 20.x
- **npm** >= 10.x
- **MySQL** >= 8.0 (or MariaDB 10.6+)
- **Git**

---

## 1. Clone the Repository

```bash
git clone <repository-url> lumen-ecommerce
cd lumen-ecommerce
```

## 2. Backend Setup

```bash
cd ecommerce-api

# Install PHP dependencies
composer install

# Create environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# Edit DB_DATABASE, DB_USERNAME, DB_PASSWORD

# Create the database
mysql -u root -p -e "CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
php artisan migrate

# (Optional) Seed sample data
php artisan db:seed

# Create storage symlink
php artisan storage:link

# Start development server
php artisan serve
```

The API is now available at `http://localhost:8000`.

### Verifying the Backend

```bash
# Check all routes are registered
php artisan route:list

# Check database tables
php artisan db:show

# Run tests
php artisan test
```

## 3. Frontend Setup

```bash
cd ecommerce-app

# Install Node.js dependencies
npm install

# Create environment file
# Note: The frontend may not have a .env.example; create .env.local manually
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
echo "NEXT_PUBLIC_STORAGE_URL=http://localhost:8000/storage" >> .env.local

# Start development server
npm run dev
```

The frontend is now available at `http://localhost:3000`.

## 4. Development Scripts

The backend `composer.json` includes convenience scripts:

```bash
# Full project setup (composer install + .env + migrate + npm)
composer run setup

# Start all dev servers concurrently (API + queue + logs + Vite)
composer run dev
```

## 5. Seeding the Database

```bash
# Run all seeders
php artisan db:seed

# This creates:
# - Admin user: admin@lumenstore.com / password
# - Sample products, categories, brands
# - Settings (shipping, tax, invoice)
# - Shipping methods
```

## 6. Default Credentials

After seeding:

| Role  | Email                   | Password |
|-------|-------------------------|----------|
| Admin | admin@lumenstore.com    | password |
| User  | (varies by seeder)      | password |

## 7. Running Tests

```bash
cd ecommerce-api

# Run all tests
php artisan test

# Run specific test file
php artisan test --filter=CouponTest

# Run with verbose output
php artisan test --verbose
```

## 8. TypeScript Type Checking (Frontend)

```bash
cd ecommerce-app

# TypeScript check (no emit)
npx tsc --noEmit

# Lint
npm run lint
```
