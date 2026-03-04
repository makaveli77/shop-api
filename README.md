🛒 Shop API - TypeScript, Node.js & PostgreSQL

A professional, containerized RESTful API built with TypeScript, Node.js (Express) and PostgreSQL, following a high-scale Layered Architecture (Route-Middleware-Controller-Service-DTO-Repository).

📑 Summary of Project Status

The Shop API is a production-grade backend system, fully containerized and secured.

Architecture: Clean 10-Pillar Layered pattern for strict separation of concerns (now includes Queries & Cache Service).
Domain: E-commerce and inventory management, spanning Articles, Categories, Suppliers, Digital Wallets, Stripe Deposits, and Orders.
Performance: Optimized with GIN Trigram fuzzy search, Covering Indexes, GZIP Compression (~90% size reduction), and server-side caching for stats endpoints.
Integrations: Fully functional payment processing layer built with strict ACID database locks and webhook security via Stripe.
Resilience: Multi-stage Docker builds, Docker Healthchecks for self-healing and GitHub Actions CI for automated testing.
Traffic Control: Rate Limiting (100 req/15 min, configurable) to prevent scraping and brute-force.

🌟 Key Features

Full TypeScript: Complete type safety with strict mode, barrel exports (`src/types/`), and generics for better DX and reliability.
Layered Architecture: Clean separation of concerns for maximum scalability.
ACID Transactions: Immutable e-wallet ledgers and reliable checkout operations using PostgreSQL 'FOR UPDATE' row-locking to prevent race conditions.
JWT Authentication: Stateless security using JSON Web Tokens.
Email Verification: Secure user registration with email confirmation flow using JWT.
Password Reset: Stateless, secure email-based reset flow using signed JWT tokens (invalidated on password change).
Soft Deletes: Data preservation using a deleted_at pattern.
Advanced Search & Filtering: Dynamic queries supporting partial text search, sorting, and pagination.

Real-time Statistics: Aggregation API providing inventory value and stock health metrics, with server-side cache for performance.
Batch Operations: High-performance batch insertion for articles via /articles/batch endpoint.
Image Handling: Multi-part file uploads supported via Multer and static serving of uploaded images.
Rate Limiting: express-rate-limit middleware with headers for API protection.
Interactive Documentation: Full OpenAPI 3.0 (Swagger) support with documented Rate Limit Headers at /api-docs.
Testing Suite: Comprehensive integration testing (`src/__tests__`) using Jest and Supertest, verifying Authentication, User Creation, Endpoints logic, complex Order repository mocking, and Cache invalidation flows.

## 🚀 Getting Started (From Scratch)

If you have just pulled this project from GitHub, follow the automated 1-Click step to build the application and begin hitting the endpoints locally!

### 1-Click Initialization (Recommended)
Ensure you have **Node.js** and **Docker Desktop** installed and running on your machine.

**For Mac/Linux:**
```bash
npm run setup
```

**For Windows:**
```bash
npm run setup:win
```
*Once completed, visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) in your browser to view the interactive Swagger dashboard!*

---

### Option B: The Pure Docker Route
If you prefer not to install Node.js locally at all and want the API entirely containerized alongside the Database engine:
```bash
# 1. Setup your environment variables
cp .env.example .env

# 2. Build and boot both the Postgres DB and the Node Web Server
docker-compose up --build
```
*(Note: If running the backend inside docker this way, open your `.env` file and change `DB_HOST=localhost` to `DB_HOST=db` so the Docker bridge network maps correctly).*

---

### Option C: The Manual Route (Step-by-Step)
For granular control over the environment setup.

**1. Setup Environment Variables**
```bash
cp .env.example .env
```

**2. Install NPM Dependencies & Boot DB**
```bash
npm install
docker-compose up db -d
```

**3. Run Knex Migrations & Seed Data**
```bash
npm run migrate
npm run seed
```

**4. Run Local Server & Tests**
```bash
npm run dev
npm run test
```

### 9. Seed Database (Scale Testing Data)

To populate the local database with realistic test entries so you can immediately begin using the API and writing frontend applications, execute the seed command. The system uses Faker.js explicitly.
```bash
npm run seed
```

**What gets created?**
- 1 Admin User (`admin` / `password123`) & 9 standard Users (all with `password123`).
- 15 Article Categories.
- 50 Suppliers.
- 1,000 Articles (with assorted prices, stock, statuses, `tags`, and `description`).
- 100 User Deposits.
- 50 User Withdrawals.
- 1,200 Orders simulating real user checkouts and stock deductions.

**Note:** The system uses true Knex migrations for schema changes, skipping monolithic init files. Migrations run automatically on startup via `docker-compose up --build`. To completely reset your database environment locally, simply run:
```bash
docker-compose down -v && docker-compose up --build
```

📊 Database Migrations

Instead of a monolithic init.sql, this project uses **Knex.js migrations** for structured schema management:

**Migration Files** (`src/migrations/`)
 `001_create_extensions.js` - Enable PostgreSQL extensions (pg_trgm for fuzzy search)
 `002_create_category_table.js` - Create category table + index on name
 `003_create_supplier_table.js` - Create supplier table + indexes (city, company_name, coordinates, created_at)
 `004_create_user_table.js` - Create user table + `is_verified` column + seed admin user + index on created_at (username: admin, password: password123)
 `005_create_article_table.js` - Create article table + comprehensive article indexes
 `006_create_article_discounts.js` - Add discount columns to article table and create article_discount table
 `007_create_article_category_table.js` - Create article_category many-to-many join table

**Automatic Execution**
Migrations run automatically when Docker starts:
```bash
docker-compose up --build
# Runs: npm run migrate && npm run dev
```

**Manual Migration Commands**
```bash
# Run pending migrations
npm run migrate

# Create a new migration file
npm run migrate:make add_column_to_article

# Rollback the last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status
```

**Benefits of Migrations vs init.sql**
✅ **Version Control** - Track schema changes in Git with full history  
✅ **Repeatable** - Same migrations across dev, staging, production  
✅ **Rollback Support** - Undo changes if needed  
✅ **Team Collaboration** - No merge conflicts on schema files  
✅ **Audit Trail** - See exactly what changed and when  
✅ **Self-Documenting** - Each migration is explicit and purposeful  

**Migration Tracking**
Knex automatically creates a `knex_migrations` table to track execution:
```bash
docker exec -it shop-db psql -U user -d shop_db -c "SELECT * FROM knex_migrations;"
```

### 🏛️ E-Wallet Checkout Architecture vs Direct Gateways
Instead of binding E-commerce Orders directly to Stripe/PayPal (which requires tedious, asynchronous webhooks for *every single order*), this platform utilizes a resilient **E-Wallet Pre-funding Model**:
1. **Deposits**: Users explicitly top-up their `wallet` using Stripe (`/deposits/initiate`). This connects securely to Stripe Webhooks solely for adding fundamental base balance to their immutable database ledger.
2. **Withdrawals**: Users can request a withdrawal (`/deposits/withdraw`) which utilizes Stripe's Refund API to securely return unused wallet funds back to their originally deposited payment method.
3. **Instant Checkout**: Ordering items strictly deducts from this pre-funded `wallet` locally. This prevents the need for external webhooks or crons during checkout, eliminating external API failure rates.
4. **Database Concurrency Control**: Checkout (`/orders`) uses pure ACID PostgreSQL row-locks (`FOR UPDATE OF wallets, articles`). This guarantees you cannot have racing requests leading to double-spends or negative balances.

**Database Indexes for Performance**
All tables include strategic indexes created during migration for query optimization:

*Article Table (in 005 & 006):*
- `idx_article_name_trgm` - GIN trigram index for fuzzy search on article names
- `idx_article_active_id` - Partial index for active articles (WHERE deleted_at IS NULL)
- `idx_article_price` - B-tree index for price filtering and sorting
- `idx_article_created_at` - Descending index for newest-first sorting
- `idx_article_supplier_id` - Foreign key index for supplier joins
- `idx_article_stats_covering` - Covering index optimized for stats API (includes price, stock_quantity)
- `idx_article_discounted` - Index for filtering discounted articles
- `idx_article_expires_at` - Index for filtering articles by expiration date

*Article Category Table (in 007):*
- `idx_article_category_article_id` - Foreign key index for article joins
- `idx_article_category_category_id` - Foreign key index for category joins

*Supplier Table (in 003):*
- `idx_supplier_city` - Index for geographic/city-based filtering
- `idx_supplier_company_name` - Index for company name searches
- `idx_supplier_coordinates` - Composite index for latitude/longitude geo queries
- `idx_supplier_created_at` - Descending index for sorting by creation date

*Category Table (in 002):*
- `idx_category_name` - Index for category name searches and joins

*User Table (in 004):*
- `idx_user_registration_date` - Descending index for sorting by registration date
- (username and email already have unique indexes from constraints)
- Columns: id, username, email, password_hash, first_name, last_name, registration_date, last_login, is_locked, is_verified

*Wallets & Deposits (in 008, 009, 012):*
- `idx_wallet_user_id` - Foreign key lookup to match wallets to users
- `idx_wallet_transaction_wallet_id` - Lookup for transaction history per wallet
- `idx_wallet_transaction_created_at` - Descending sort for ledger history
- `idx_deposit_request_provider_tx_id` - Core lookup for matching incoming Stripe webhooks to pending deposits

*Orders & Checkout (in 010, 011):*
- `idx_order_user_id` - Quick lookup of a user's past purchases
- `idx_order_item_order_id` - For high-speed relationship joins with items
- `idx_order_item_article_id` - To determine which articles are selling best

**User Table Changes (v2):**
- `first_name` and `last_name` columns for user profile
- `registration_date` replaces `created_at` for clarity
- `last_login` timestamp is updated automatically on successful login

**Seed Files** (`src/seeds/`)
After migrations create the schema, seed files populate the database:
- `index.ts` - Main seed orchestrator that runs all seeders
- `category.seed.ts` - Generates 15 categories
- `supplier.seed.ts` - Generates 50 suppliers across global cities
- `article.seed.ts` - Generates 1,000 articles with random assignments, automatically links them to categories in the `article_category` join table, and randomly applies discounts.
- `order_deposit.seed.ts` - Massive scale data simulator generating 10 users with $100K wallet balances, 100 Stripe deposit requests, and 1,200 unique random E-commerce orders correctly bound by `FOR UPDATE` ACID transactions to ensure valid stress testing.
- `withdrawal.seed.ts` - Safely decrements randomized wallet balances to mimic users withdrawing idle funds via payouts back to their original payment methods.

**Seeding Process**
```bash
# Seeds all data (categories, suppliers, articles, deposits, orders, withdrawals)
npm run seed

# Or inside Docker
docker exec -it shop-api npm run seed

# Output snippet:
# 🌱 Initializing Database Seeds...
# 🌱 Seeding users and wallets...
# ✅ 10 users seeded with wallets
# 🌱 Seeding categories...
# ✅ 15 categories seeded
# 🌱 Seeding suppliers...
# ✅ 50 suppliers seeded
# 🌱 Seeding 1000 articles...
# ✅ 1000 articles seeded
# ✅ Linked 1000 article-category entries
# ✅ Seeded 221 article discounts
# 🌱 Seeding Deposits and Orders...
# ✅ 100 deposits seeded
# ✅ 1200 orders seeded (700 completed, 300 failed, 200 pending)
# 🌱 Seeding Withdrawals...
# ✅ 50 withdrawals seeded
# ✅ All seeds completed successfully!
```


📖 API Endpoint Reference


### 🔑 Authentication

**Default Admin Credentials (for testing)**
```
Username: admin
Password: password123
Email: admin@example.com
First Name: Admin
Last Name: User
```


**Login Example**
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'

# Response (Success):
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Response (Unverified):
# {"status": "error", "message": "Account is not verified. Please check your email."}
```

**Using JWT Token**
```bash
curl -X GET http://localhost:3000/articles \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

| Method | Endpoint   | Description                                 | Auth   |
|--------|------------|---------------------------------------------|--------|
| POST   | /login     | Exchange credentials for a JWT Bearer Token. Fails if email is not verified. | Public |
| POST   | /register  | Register a new user. Sends a verification email. | Public |
| GET    | /auth/verify | Verify newly registered user email via token | Public |
| POST   | /forgot-password | Request a 15-min password reset link (Email) | Public |
| POST   | /reset-password | Reset password using the token received in email | Public |


### 📧 Email Configuration & Local Testing

The project uses `nodemailer` for email services (Password Resets & Email Verification).

**1. Development / Testing (Default)**
By default, if no email credentials are provided in `.env`, the system uses **Ethereal Email** (a fake SMTP service).
- When you register or request a password reset, check your **terminal/console logs**.
- You will see a `Preview URL`. Click it to view the "sent" email in your browser.
- No setup required!

**2. Production / Real Emails**
To send real emails (e.g., via Gmail, SendGrid, Outlook), update your `.env` file:

```env
# Example for Gmail (Requires App Password if 2FA is on)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_SECURE=false

# Frontend URL for Verification/Reset Links
FRONTEND_URL=http://localhost:3000
```


### 📦 Product Management

| Method | Endpoint           | Description                                              | Auth |
|--------|--------------------|----------------------------------------------------------|------|
| GET    | /articles          | List articles with filters (`tags`, `description`), sorting, and Pagination Metadata (Cached). Includes `discounted_price` if active. | JWT  |
| GET    | /articles/:id      | Get full details for a single article (Includes `tags` and `discounted_price`) | JWT  |
| POST   | /articles          | Create article. Supports `tags` array & image upload (form-data)        | JWT  |
| POST   | /articles/batch    | Bulk insert an array of articles (High-performance)      | JWT  |
| POST   | /articles/discounts| Bulk/Single insert of active discounts on articles       | JWT  |
| PUT    | /articles/:id      | Update article properties, `tags`, and categories                 | JWT  |
| DELETE | /articles/:id      | Soft delete an article (flags deleted_at)                | JWT  |

**Discount Logic:**
When fetching articles (both list and single endpoints), the API automatically performs a `LEFT JOIN` with the `article_discount` table. If an article has an active discount (where `expires_at` is either `NULL` or in the future), the response will include a `discounted_price` field. If there is no active discount, this field will be omitted or `null`.

### 🏷️ Category Management

| Method | Endpoint           | Description                                              | Auth |
|--------|--------------------|----------------------------------------------------------|------|
| GET    | /categories        | List all categories (Cached)                             | JWT  |
| GET    | /categories/:id    | Get full details for a single category                   | JWT  |
| POST   | /categories        | Create a new category                                    | JWT  |
| PUT    | /categories/:id    | Update category properties                               | JWT  |
| DELETE | /categories/:id    | Soft delete a category                                   | JWT  |

### 🏢 Supplier Management

| Method | Endpoint           | Description                                              | Auth |
|--------|--------------------|----------------------------------------------------------|------|
| GET    | /suppliers         | List suppliers with pagination (Cached)                  | JWT  |
| GET    | /suppliers/:id     | Get full details for a single supplier                   | JWT  |
| POST   | /suppliers         | Create a new supplier                                    | JWT  |
| PUT    | /suppliers/:id     | Update supplier properties                               | JWT  |
| DELETE | /suppliers/:id     | Delete a supplier                                        | JWT  |

*Note: All `POST` and `PUT` endpoints for Articles, Categories, and Suppliers are strictly validated using Joi schemas to ensure data integrity before reaching the controllers.*


### 📊 Business Intelligence & Health

| Method | Endpoint         | Description                                         | Auth   |
|--------|------------------|-----------------------------------------------------|--------|
| GET    | /articles/stats  | Returns total inventory value and stock counts       | JWT    |
| GET    | /test            | API health check used by Docker Healthcheck          | Public |
| GET    | /db-test         | Checks database connection and returns status        | Public |

- **Caching Strategy**: The list endpoints (`/articles`, `/categories`, `/suppliers`) and the `/articles/stats` endpoint use server-side caching (`node-cache`) to optimize performance.
- **Cache Duration (TTL)**: 
  - Categories & Suppliers: 1 hour
  - Articles & Stats: 5 minutes
- **Cache Invalidation**: Caches are automatically invalidated (cleared) whenever a `POST`, `PUT`, or `DELETE` operation occurs on the respective resource, ensuring data consistency.
- **Freshness Indicator**: The stats response includes a `source` field ("cache" or "database").

Note on Caching: If data seems slightly delayed on list endpoints, it is due to the TTL (Time-To-Live) configuration designed to protect database performance during high traffic.

### 💰 Wallets & Deposits (Stripe)

| Method | Endpoint           | Description                                              | Auth |
|--------|--------------------|----------------------------------------------------------|------|
| POST   | /deposits/initiate | Starts a Stripe deposit session and creates a DB lock    | JWT  |
| POST   | /deposits/withdraw | Withdraws deposited funds back to the original payment method via Stripe Refunds | JWT |
| POST   | /deposits/mock-success/:id | *(Dev Only)* Simulates Stripe Webhook locally | JWT  |
| POST   | /webhooks/stripe   | Stripe server-to-server webhook callback (raw payload)   | None |

#### 💳 Frontend Implementation Guide (Stripe)
When building the user interface, follow this exact request orchestration flow to securely process Stripe deposits:

1. **Initiate Request (Backend):**
   - The frontend posts a request to the backend `POST /deposits/initiate` with `{ "amount": 50 }` (amount to deposit).
   - The backend responds with a `clientSecret` and a generated `deposit_request_id`.

2. **Render Element (Frontend):**
   - The frontend passes the returned `clientSecret` into the Stripe SDK (`Elements` or `Payments Element` UI).
   - The user inputs their credit card information securely via Stripe's iFrame.

3. **Confirm Payment (Frontend):**
   - The frontend calls `stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: "..." }})`.
   - The user will be redirected (e.g. for 3D Secure / Bank authentication) and returned to your app.

4. **Fulfillment (Webhook):**
   - Wait! The Frontend does *not* credit the user account directly.
   - Upon successful payment at step 3, Stripe automatically sends an event asynchronously to `POST /webhooks/stripe`.
   - The API will verify the signature, process the lock, and definitively fund the wallet.

**🛠️ Testing UI Locally (Mock):**
To skip live Stripe API interactions on Localhost entirely without Webhooks:
1. Hit `POST /deposits/initiate` (Receive `deposit_request_id: 15`).
2. Make a fast UI button calling `POST /deposits/mock-success/15` with an empty body (`{}`).
3. Done. The API behaves exactly like a heavily-locked webhook execution!

*Note on Local Testing: The `/deposits/mock-success/:id` endpoint is intentionally exposed only when `NODE_ENV=development`. This allows developers to fully simulate and test the database locking and balance updates without needing the Stripe CLI to send live webhooks. It is strictly blocked in production environments.*

*Note on Security: The deposit system uses strictly controlled database transactions (`FOR UPDATE` row-locking) to guarantee funds are successfully added to the user's permanent immutable ledger exactly once.*

### 🛒 Orders & Checkout

| Method | Endpoint           | Description                                              | Auth |
|--------|--------------------|----------------------------------------------------------|------|
| GET    | /orders            | List cached orders (with pagination). Supports filters: `status`, `user_id`, `created_at`, `updated_at`, `include_articles` | JWT  |
| GET    | /orders/:id        | View complete order and itemized receipt                 | JWT  |
| POST   | /orders            | Submits a checkout transaction                           | JWT  |

*Note: The `POST /orders` operation executes a large ACID transaction that recalculates subtotals independently, verifies stock limits, deducts the payment securely from the e-wallet, and deducts the inventory stock with concurrent write protection.*

🛠 Developer Reference

Final Project DNA (The 10 Pillars)
1. Routes: Defined URL entry points mapping specific paths to their respective logic.
2. Middleware: Global "Bouncers" handling Compression, Rate Limiting, and Auth (JWT).
3. Validation: Strict Joi schema enforcement to block "dirty" data before it reaches the core.
4. File Handling: Multer engine for secure processing and storage of article images.
5. Controllers: Orchestration of the Request/Response flow and HTTP handling logic.
6. Services: Business logic layer containing domain operations and repository orchestration.
7. DTOs: The "Data Contracts" that strictly clean and shape incoming data.
8. Repositories: The Data Access Layer managing complex Joins and Performance Tuning.
9. Queries: Centralized SQL query management - all raw SQL organized by resource type.
10. Cache Service: Smart cache invalidation with granular TTL management.

Swagger/OpenAPI setup is centralized in `src/config/swagger.ts` and used in the main router.

🔨 Development Commands

**TypeScript Dependencies (Already Installed)**
```bash
npm install --save-dev typescript @types/node @types/express @types/jsonwebtoken @types/bcryptjs @types/cors @types/compression @types/multer @types/swagger-jsdoc @types/swagger-ui-express @types/jest @types/supertest ts-node ts-jest
```

**Build & Run**
```bash
# Build TypeScript to JavaScript
npm run build

# Development mode with hot reload
npm run dev

# Production mode (compiled)
npm start

# Run tests
npm test
```

**Database Migrations**
```bash
# Run pending migrations
npm run migrate

# Create new migration
npm run migrate:make create_orders_table

# Rollback if needed
npm run migrate:rollback
```

🧪 Testing

```bash
# Inside Docker (Recommended)
docker exec -it shop-api npm test

# Locally
npm test
```

All tests use **ts-jest** for native TypeScript support without pre-compilation.

**Pre-commit Hooks (Husky + lint-staged)**
To ensure code quality and prevent broken commits, this project uses Husky and lint-staged.
Before every commit, Jest tests are automatically run **only on staged files** (the "fast" option).

```bash
# The pre-commit hook runs:
npm run test:staged
# Which executes: jest --findRelatedTests --passWithNoTests
```
This guarantees that any modified files pass their related tests before they can be committed, without the overhead of running the entire test suite.

� Docker Commands Reference

**🔄 Complete Docker Rebuild (Fresh Start)**
```bash
docker-compose down -v                    # Stop containers and remove volumes
docker-compose up --build                 # Build images and start containers
```

**🗄️ Database Migrations**
```bash
docker exec -it shop-api npm run migrate              # Run all pending migrations
docker exec -it shop-api npm run migrate:rollback     # Rollback last migration
docker exec -it shop-api npm run migrate:status       # Check migration status
docker exec -it shop-api npm run migrate:make add_new_column  # Create new migration
```

**🌱 Seed Database**
```bash
docker exec -it shop-api npm run seed                 # Insert 1,000+ articles
```

**🧪 Run Tests**
```bash
docker exec -it shop-api npm test                     # Run all tests (13 tests)
```

**🔨 Build TypeScript**
```bash
docker exec -it shop-api npm run build                # Compile TS to dist/
```

**📋 Monitoring & Debugging**
```bash
docker-compose logs -f shop-api           # Watch API logs
docker-compose logs -f db                 # Watch database logs
docker exec -it shop-api sh               # Access container shell
docker exec -it db psql -U user -d shop_db  # Access PostgreSQL CLI
```

**🛑 Stop Without Removing Volumes**
```bash
docker-compose down                       # Keep database data
```

**🧹 Nuclear Option (Clean Everything)**
```bash
docker-compose down -v --rmi all          # Remove containers, volumes, AND images
docker system prune -a                    # Remove all unused Docker data
```

**Typical Workflow**
```bash
# Fresh start
docker-compose down -v && docker-compose up --build

# Wait for "Server started on port 3000", then in new terminal:
docker exec -it shop-api npm run seed     # Load test data
docker exec -it shop-api npm test         # Verify everything works
```

�🛡 Security
SQL Injection: Prevented via Parameterized Queries.
Data Validation: Strict schema enforcement via Joi.
Rate Limiting: Protected via express-rate-limit.

🏥 Docker Health Checks & Auto-Healing

The docker-compose.yml includes automated health checks for both services:

**Database Health Check**
- Command: `pg_isready` - verifies PostgreSQL is accepting connections
- Interval: Every 10 seconds
- Timeout: 5 seconds per check
- Retries: 5 failures before marking unhealthy
- Start Period: 10 seconds (grace period after container starts)

**API Health Check**
- Command: `curl http://localhost:3000/test` - verifies API is running and database-connected
- Interval: Every 10 seconds
- Timeout: 5 seconds per check
- Retries: 3 failures before marking unhealthy
- Start Period: 15 seconds (longer grace period for app startup)
- Auto-Restart: `unless-stopped` policy automatically restarts failed containers

**Dependency Management**
The API waits for the database to be `healthy` (not just running) before starting:
```yaml
depends_on:
  db:
    condition: service_healthy
```

This ensures the database is fully responsive before the API attempts to connect.

**Monitoring Health**
```bash
# Check service status
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' shop-db | jq
docker inspect --format='{{json .State.Health}}' shop-api | jq
```


📑 Technical Stack (What is Configured)

**Core Infrastructure & DevOps**
* PostgreSQL 15 (Container): Relational database with custom performance tuning.
* Node.js 18 (Container): High-performance API runtime environment.
* Docker Compose: Manages multi-container orchestration and networking.
* GitHub Actions: Continuous Integration pipeline for automated testing and GitFlow-based deployments (Staging & Production).

Backend Framework & Utilities
* TypeScript (v5.x): Full type safety with strict mode, interfaces, and type inference.
* Express.js (v5.x): Modern web framework using the latest middleware standards.
* pg (node-postgres): Non-blocking database driver for Node.js with type definitions.
* Dotenv: Secure environment variable management.
* CORS: Cross-origin support for React/Vue/Mobile frontend integration.

Security, Validation & Traffic Control
* JWT (jsonwebtoken): Stateless Bearer token authentication logic.
* Bcryptjs: Industry-standard one-way password hashing.
* Joi: Schema-based validation "Bouncer" for every incoming request.
* Express-rate-limit: Traffic control to prevent brute-force and scraping.

Data Handling & Quality Assurance
* Multer & Express Static: Engine for processing and serving article image uploads.
* Pagination Metadata: Rich response objects (total_pages, has_next_page, etc.).
* Batch Operations: High-speed bulk insertion logic for inventory management.
* Node-cache: Server-side caching with TTL management for stats optimization.
* Swagger (JSDoc & UI): Automatic OpenAPI 3.0 documentation generation.
* ts-jest & Supertest: Full integration testing suite with TypeScript support and repository mocking.
* Faker.js: High-load seeding script for generating 1,000+ realistic records.

🧠 Code Organization & Best Practices

**TypeScript Architecture**
The entire codebase is written in TypeScript with:
- Strict type checking enabled for maximum safety
- Centralized types using the Barrel Pattern (`src/types/index.ts`)
- Separated domain types (`article.types.ts`, `user.types.ts`, etc.)
- Generic database query wrapper with typed results
- Custom type augmentation for Express.js Request objects (`src/types/express.d.ts`)
- Full IDE autocomplete and IntelliSense support

**Deployment Strategy (GitFlow)**
The project uses a 3-branch GitFlow strategy integrated with GitHub Actions:
- `develop`: For integrating feature branches. Runs tests and builds.
- `staging`: Merging here triggers the `deploy_staging` webhook to update the staging server.
- `main`: Merging here triggers the `deploy_production` webhook to update the live production server.

**Query Separation**
All raw SQL queries are centralized in `src/queries/` folder, organized by resource:
- `src/queries/article.queries.ts` - Article CRUD and stats queries
- `src/queries/category.queries.ts` - Category CRUD queries
- `src/queries/supplier.queries.ts` - Supplier CRUD queries
- `src/queries/user.queries.ts` - User authentication queries

Benefits: Easier SQL auditing, version control for queries, testable query logic.

**Cache Management**
Centralized cache service in `src/services/cache.service.ts` provides:
- Unified cache interface for get/set/delete operations
- Smart stats invalidation based on supplier_id (granular, not global)
- Batch invalidation for multi-supplier operations
- Configurable TTL per operation (default 5 minutes for stats)
- Observable cache statistics

Strategy: When an article in supplier_id=5 is updated, only `stats_5_all` cache clears—other suppliers' stats remain cached.

**Comment Standards**
All procedural comments follow clean naming:
- `// Whitelist for sorting` (instead of `// 1. Whitelist for sorting`)
- `// Base Query parts` (instead of `// 2. Base Query parts`)
- Improves code readability and reduces cognitive overhead.

---
