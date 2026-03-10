# NutriSync — Clinical Nutrition AI Platform

> AI-powered hospital nutrition management system that automates meal planning, tracks patient dietary compliance, and optimizes kitchen production workflows.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4, Zustand 5, React Router 7, Recharts 3, Framer Motion, Lucide Icons, Radix UI, shadcn/ui |
| **Backend** | Node.js, Express 4, TypeScript, Zod validation |
| **Database** | Cloudflare D1 (SQLite via REST API) |
| **AI** | Google Gemini 1.5 Flash |
| **Auth** | JWT (7-day expiry), bcryptjs password hashing |

---

## Features

### AI Meal Plan Generation
- Google Gemini 1.5 Flash generates **7-day clinically-appropriate meal plans** tailored to each patient's diagnosis, allergies, restrictions, preferences, and nutrition targets
- Uses **only available inventory ingredients** from the kitchen stock
- Automatic **fallback to template-based plans** when the AI service is unavailable
- Each meal includes ingredients list, nutrition breakdown, portion sizes, and prep instructions

### Clinical Nutrition Engine
- **BMI calculation** with category classification (Underweight / Normal / Overweight / Obese)
- **BMR** via Mifflin-St Jeor equation (gender-adjusted)
- **TDEE** with activity multipliers (sedentary → very active)
- **Clinical calorie adjustments** — Obese patients get 85% TDEE, Underweight get 115%, post-surgery +20%, minimum floor of 1200 kcal
- **Condition-specific macro distribution** — Diabetic (25/40/35 P/C/F), Renal (10/55/35), High-protein (35/40/25), Default (20/50/30)
- **Electrolyte limits** — Cardiac/hypertension: sodium 1200–1500mg; Renal: potassium capped at 2000mg

### Restriction Validation & Auto-Substitution
- Scans every AI-generated meal against patient allergies and dietary restrictions
- Maintains a substitution table (e.g., banana → apple, sugar → stevia, red meat → chicken breast, butter → olive oil)
- Flags meals exceeding 35% daily sodium, 40% daily potassium, or 45% daily calories
- Checks ingredient availability against current inventory stock

### Smart Diet Grouping
- Automatically clusters patients into kitchen production groups by diet type + texture + calorie bucket + vegetarian preference
- Computes per-patient portion multipliers (0.5×–2.0×) for batch cooking efficiency
- Human-readable group names like "Diabetic Diet (Vegetarian)"

### Compliance Monitoring & Alerting
- Real-time meal refusal and caloric deficit detection
- Weekly deficiency reports flag protein and calorie shortfalls against targets
- Alert propagation across dashboard views

---

## Application Pages

### Login Page (`/login`)

Three switchable design themes (persisted in localStorage):

| Theme | Description |
|-------|-------------|
| **Minimal** | Clean card on gray background with emerald accent |
| **Split** | Teal gradient left panel with feature highlights + right form panel |
| **Warm** | Amber/orange themed card with soft blob decorations |

- Email + password form with show/hide toggle
- **Demo credential buttons** — one-click fill for Doctor, Kitchen Staff, and Admin accounts
- Loading state and error feedback

---

### Doctor Dashboard (`/doctor`)

The primary clinical workspace for managing patients and generating AI meal plans.

**Stats Bar:**
- Active Patients count
- Diabetic Diet count
- Renal Diet count
- AI generation status

**Patient List:**
- Search/filter by name, patient ID, or ward
- Expandable patient rows showing:
  - **Header** — Name, diet type badge (color-coded), patient ID, age, gender, room, ward, BMI bar, daily calorie target
  - **Expanded details** — 8 macro/nutrient targets (protein, carbs, fat, fiber, sodium, potassium, BMR, texture), diagnosis tags, allergy tags with warning icons
  - **"Generate AI Meal Plan" button** — triggers Gemini to produce a 7-day plan for the patient

**Register New Patient Modal:**
- 14-field form: name, age, gender, activity level, height, weight, diet type (11 options), texture (4 options), room, ward, diagnosis, allergies, dietary restrictions, food preferences
- Backend auto-computes BMI, BMR, and nutrition targets on save

**Refresh** button to reload the patient list.

---

### Patient Dashboard (`/patient`)

Meal tracking and daily nutrition monitoring for individual patients.

**Patient Selector:**
- Dropdown showing patient name, ID, and diet type

**Summary Cards:**
- Calorie Target, Protein Target, Carbs Target, BMI with category label

**Today's Nutrition Progress:**
- 4 animated progress bars (Calories, Protein, Carbs, Fat) showing consumed vs. target amounts

**Today's Meals Grid:**
Each meal card displays:
- **Meal type badge** — Breakfast (amber), Lunch (blue), Dinner (violet), Snack (green)
- Meal name and portion size
- **Status badge** — Pending / Eaten / Partial / Refused (with icons)
- Nutrition mini-grid (Cal / Pro / Carb / Fat)
- Validation warnings (amber) if any allergy or restriction flags exist
- **Action buttons**: Eaten (100% consumed) · Partial (60%) · Refused (0%) — records to tracking API and recalculates macros

When no active meal plan exists, a prompt guides the user to request one from their doctor.

---

### Kitchen Dashboard (`/kitchen`)

Kitchen production planning and inventory management with two tabs.

**Stats Bar:**
- Diet Groups count
- Ingredients count
- Low Stock count (highlighted red when > 0)

**Low Stock Alert Banner:**
- Lists all ingredients below their reorder level

**Re-run Grouping Button:**
- Triggers the diet grouping engine to re-cluster patients

#### Tab: Production Plan
- Grid of **Group Cards**, each showing:
  - Group name and code
  - Patient count
  - Calorie range and texture
  - Dietary restriction tags (color-coded: diabetic=orange, renal=blue, cardiac=red, liquid=cyan)
  - Expandable patient list with individual portion multipliers (e.g., ×1.2)

#### Tab: Inventory
- Table view: Ingredient, Category, Calories/100g, Stock with ±10 quick-adjust buttons, Reorder level, Status badge
- Inline stock updates

---

### Inventory Page (`/inventory`)

Full ingredient management with stock tracking.

**Stats:**
- Total Items, In Stock, Low/Out of Stock counts

**Low Stock Banner:**
- Lists ingredient names that need restocking

**Filters:**
- Text search + category dropdown (grains, protein, dairy, vegetable, fruit, fat, beverage, supplement, other)

**Inventory Table:**
- Columns: Ingredient (with availability indicator), Category, Macros/100g (Cal, P, C, F), Stock (inline number input + "Set" button), Reorder Level, Allergens (orange tags), Remove action
- Low-stock rows highlighted in red

**Add Ingredient Modal:**
- Fields: Name, Category, Calories/Protein/Carbs/Fat per 100g, Stock Qty, Stock Unit (kg/g/liters/ml/pieces/units), Reorder Level, Allergens (comma-separated), Restrictions

**Delete** action with confirmation dialog.

---

### Analytics (`/analytics`)

Data visualization and reporting with two tabs.

#### Tab: Patient Report
- Patient selector dropdown
- **Deficiency alert banner** (amber) when protein/calorie shortfalls detected
- **Stat strip**: Compliance Rate (with trend icon), Acceptance Rate, Avg Calories, Avg Protein
- **Line chart** — Dual Y-axis: Daily Calories (left) + Compliance % (right) over time
- **Stacked bar chart** — Meals per day by status (Eaten = green, Partial = amber, Refused = red)
- **Donut pie chart** — Overall meal breakdown (Eaten / Partial / Refused) with legend

#### Tab: Ward Summary
- 4 stat cards: Total Patients, Tracked Today, Avg Compliance %, High Alerts
- Tracking coverage progress bar (tracked / total)
- Alert banner when high-alert patients exist

---

## Sidebar Navigation

The left sidebar uses a teal-to-emerald gradient and filters navigation items by user role:

| Nav Item | Icon | Accessible To |
|----------|------|---------------|
| **Doctor** | Stethoscope | Admin, Doctor |
| **Patient** | Users | Admin, Doctor, Patient |
| **Kitchen** | Utensils | Admin, Kitchen Staff, Doctor |
| **Analytics** | Bar Chart | Admin, Doctor |
| **Inventory** | Package | Admin, Kitchen Staff, Doctor |

Additional sidebar elements:
- NutriSync logo with "Clinical AI" branding
- User name and role display
- Sign out button
- Top bar with bell icon showing alert count badge
- Toast notification system (stacked alerts in top-right corner)

---

## Database Schema

| Table | Purpose |
|-------|---------|
| **users** | App users — doctors, kitchen staff, admin (email, hashed password, role) |
| **patients** | Clinical records — demographics, BMI/BMR, diagnosis, allergies, diet restrictions, nutrition targets, ward/room |
| **ingredients** | Kitchen inventory — nutrition per 100g, stock qty, reorder level, dietary flags, allergens |
| **meal_plans** | 7-day plans — JSON day plans, status lifecycle (draft → active → completed/cancelled), AI or manual generation |
| **meal_tracking** | Daily consumption logs — per-meal status, macros consumed, compliance score, alerts |
| **diet_groups** | Kitchen production groupings — diet type, texture, calorie range, patient members with portion multipliers |

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create user account, returns JWT |
| POST | `/login` | Authenticate, returns JWT + user object |

### Patients (`/api/patients`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List patients (filtered by doctor unless admin) |
| GET | `/:id` | Get single patient |
| POST | `/` | Register patient (auto-computes BMI/BMR/targets) |
| PUT | `/:id` | Update patient (recalculates targets if clinical data changed) |
| DELETE | `/:id` | Soft-deactivate patient |

### Meal Plans (`/api/meal-plans`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List meal plans (filter by patientId) |
| GET | `/:id` | Get single plan |
| POST | `/generate` | AI meal plan generation via Gemini (with fallback) |
| GET | `/:id/today` | Get today's day plan |

### Tracking (`/api/tracking`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List tracking records (filter by patientId, date range) |
| GET | `/:id` | Get single record |
| POST | `/` | Record meal consumption (upserts per patient+date) |

### Inventory (`/api/inventory`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all ingredients |
| GET | `/low-stock` | List items below reorder level |
| POST | `/` | Add new ingredient |
| PUT | `/:id` | Update ingredient |
| PATCH | `/:id/stock` | Adjust stock (absolute or delta) |
| DELETE | `/:id` | Remove ingredient |

### Kitchen (`/api/kitchen`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/production` | Get production plan with diet groups |
| POST | `/regroup` | Re-run diet grouping engine |
| GET | `/meal-plans/today` | Get all active plans' today meals |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/weekly/:patientId` | Weekly analytics (macros, compliance, deficiencies) |
| GET | `/ward-summary` | Ward-level stats (patients, compliance, alerts) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Returns `{ status: "ok", timestamp }` |

---

## State Management (Zustand)

| Store | Purpose |
|-------|---------|
| **useAuthStore** | JWT token, user object, `login()` / `logout()` — persisted to localStorage |
| **usePatientStore** | Patient list, selected patient, loading state |
| **useMealPlanStore** | Meal plans, active plan, AI generation status |
| **useTrackingStore** | Tracking records, today's record |
| **useInventoryStore** | Ingredients list, low stock items |
| **useDietGroupStore** | Diet groups for kitchen |
| **useAlertStore** | Toast notifications (max 5), push/dismiss actions |

---

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to all pages and features |
| **Doctor** | Doctor Dashboard, Patient Dashboard, Kitchen Dashboard, Analytics, Inventory |
| **Kitchen Staff** | Kitchen Dashboard, Inventory |
| **Patient** | Patient Dashboard (own meals only) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account with D1 database
- Google Gemini API key (optional — falls back to template plans)

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_D1_DATABASE_ID=your_d1_database_id
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Running the Application

```bash
# Start backend (from backend/ directory)
cd backend
npx ts-node-dev --respawn --transpile-only src/server.ts

# Start frontend (from root directory)
npx vite --port 5173
```

Or use the VS Code compound task **"NutriSync: Start All"** to launch both servers simultaneously.

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nutrisync.com | Admin@123 |
| Doctor | doctor@nutrisync.com | Doctor@123 |
| Kitchen | kitchen@nutrisync.com | Kitchen@123 |

---

## Project Structure

```
NutriSync/
├── src/                          # Frontend source
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components (Button, Card, Input, etc.)
│   │   └── AppLayout.tsx         # Sidebar + top bar layout
│   ├── pages/
│   │   ├── LoginPage.tsx         # Auth with 3 theme variants
│   │   ├── DoctorDashboard.tsx   # Patient management + AI plan generation
│   │   ├── PatientDashboard.tsx  # Meal tracking + nutrition progress
│   │   ├── KitchenDashboard.tsx  # Production groups + inventory
│   │   ├── Analytics.tsx         # Charts + ward summary
│   │   └── InventoryPage.tsx     # Full ingredient management
│   ├── services/api.ts           # Axios API client with JWT interceptor
│   ├── store/index.ts            # Zustand stores
│   ├── types/index.ts            # TypeScript interfaces
│   └── App.tsx                   # Router configuration
├── backend/
│   ├── src/
│   │   ├── routes/               # Express route handlers
│   │   ├── services/             # Business logic
│   │   │   ├── nutritionEngine.ts    # BMI/BMR/TDEE/macro calculations
│   │   │   ├── mealPlanGenerator.ts  # Gemini AI integration
│   │   │   ├── restrictionValidator.ts # Allergy/restriction checks
│   │   │   ├── dietGroupingEngine.ts # Patient clustering
│   │   │   └── reportService.ts      # Analytics & reports
│   │   ├── db/
│   │   │   ├── schema.sql        # D1 table definitions
│   │   │   └── repositories/     # Data access layer
│   │   ├── config/
│   │   │   └── d1.ts             # Cloudflare D1 HTTP client with OAuth
│   │   ├── middleware/           # JWT auth + role authorization
│   │   └── server.ts            # Express app entry point
│   └── .env                     # Environment variables
└── .vscode/tasks.json           # VS Code launch tasks
```
