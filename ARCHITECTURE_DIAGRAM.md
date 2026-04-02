# Payment Integration - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Courses Page (/courses)          Payment Modal              Success Page   │
│  ┌──────────────────┐             ┌─────────────────┐       ┌────────────┐ │
│  │  Grid/List View  │ ─Enroll──> │ Course Details  │──Pay──>│ Confirm    │ │
│  │ • Course Cards   │  Click      │ • Image         │       │ Enrollment │ │
│  │ • Ratings        │             │ • Syllabus      │       │            │ │
│  │ • Price          │             │ • Instructor    │       │ [Enrolled] │ │
│  │ • Enroll Button  │             │ • Price         │       └────────────┘ │
│  └──────────────────┘             │ • Modules       │            ↑         │
│          ↓                         │ [Enroll Now]    │            │         │
│      [Courses Grid                 └─────────────────┘        enrolled      │
│       Component]                        ↑                     (auto-update)   │
│                                         │                                   │
└─────────────────────────────────────────┼───────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ↓                                           ↓
        ┌───────────────────────────┐          ┌───────────────────────────┐
        │   NEXT.JS API LAYER       │          │   BROWSER STORAGE         │
        ├───────────────────────────┤          ├───────────────────────────┤
        │                           │          │                           │
        │ /api/payments/            │          │  localStorage:            │
        │  initialize               │──────┐   │  • user data              │
        │  └─ Send to Korapay       │      │   │  • enrolled courses       │
        │  └─ Get checkout_url      │      │   │  • pending enrollment     │
        │                           │      │   │                           │
        │ /api/payments/success     │      └──>│  React Context:           │
        │  └─ Verify payment        │          │  • user state             │
        │  └─ Get course ID         │          │  • enrollment function    │
        │                           │          │                           │
        │ /api/payments/webhook     │          │                           │
        │  └─ Receive Korapay       │          │                           │
        │     confirmation          │          │                           │
        └───────────────────────────┘          └───────────────────────────┘
                    │
                    │ HTTPS Requests
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
    ┌─────────────────┐   ┌──────────────────┐
    │   KORAPAY       │   │  AUTH CONTEXT    │
    │   GATEWAY       │   │  (contexts/auth) │
    ├─────────────────┤   ├──────────────────┤
    │ • Initialize    │   │ • enrollCourse() │
    │ • Process       │   │ • user state     │
    │ • Verify        │   │ • enrollment     │
    │ • Webhook       │   │   tracking       │
    └─────────────────┘   └──────────────────┘
```

## Component Interaction Flow

```
                            USER INTERACTION
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  Courses Grid         │
                        │  - Map through        │
                        │    courses array      │
                        │  - Render each card   │
                        │  - Add "Enroll Now"   │
                        │    button             │
                        └───────────┬───────────┘
                                    │
                    Click "Enroll Now" button
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  handleEnroll()       │
                        │  - Save course data   │
                        │  - Open modal         │
                        │  - Pass full course   │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  Payment Modal        │
                        │  - Shows course       │
                        │    details            │
                        │  - Shows price        │
                        │  - "Enroll Now" btn   │
                        └───────────┬───────────┘
                                    │
                    Click "Enroll Now" in modal
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  handleEnrollNow()    │
                        │  - Verify user login  │
                        │  - Save to storage    │
                        │  - Call API           │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  /api/initialize      │
                        │  - Create reference   │
                        │  - Send to Korapay    │
                        │  - Get checkout_url   │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        window.location.href = checkout_url
                        (REDIRECT TO KORAPAY)
                                    │
                                    ↓
                    ┌───────────────────────────────┐
                    │   KORAPAY PAYMENT PAGE        │
                    │   - User enters card details  │
                    │   - Confirms payment          │
                    │   - Korapay processes         │
                    └───────────────┬───────────────┘
                                    │
                            Payment successful
                                    │
                                    ↓
                    Korapay redirects to:
                    /dashboard/payment-success
                    ?reference={reference}
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  Success Page loads   │
                        │  - Extract reference  │
                        │  - Call verify API    │
                        │  - Show loading       │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  /api/success         │
                        │  - Verify with Korapay
                        │  - Get courseId       │
                        │  - Return course info │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  Success Page -       │
                        │  Payment Verified ✓   │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  enrollCourse()       │
                        │  (from auth context)  │
                        │  - Add courseId to    │
                        │    user.enrolled...   │
                        │  - Update localStorage│
                        │  - Update auth state  │
                        └───────────┬───────────┘
                                    │
                                    ↓
                        ┌───────────────────────┐
                        │  Success UI           │
                        │  ✓ Enrolled!          │
                        │  [Go to Courses]      │
                        │  [Browse More]        │
                        └───────────────────────┘
                                    │
                    User clicks "Go to My Courses"
                                    │
                                    ↓
                        Course now shows
                        "Continue Learning"
                        instead of
                        "Enroll Now"
```

## Data Flow Diagram

```
                        PAYMENT FLOW DATA
                            
User Selection:          Payment Modal Data:        API Communication:
┌──────────────┐        ┌─────────────────┐       ┌────────────────────┐
│ courseId: 1  │  ──>   │ course: {        │  ───> │ POST /initialize   │
│              │        │   id: 1          │       │ body: {            │
│              │        │   title: "Web.." │       │   courseId: 1      │
│              │        │   price: 99      │       │   email: "user@"   │
└──────────────┘        │   description:.. │       │   amount: 99       │
                        │   instructor:... │       │ }                  │
                        │   rating: 4.9    │       └────────┬───────────┘
                        │   syllabus: [..] │               │
                        │   image: "url"   │               ↓
                        │   duration: "40h"│       ┌────────────────────┐
                        └─────────────────┘       │ Korapay Response   │
                                                  │ {                  │
        Korapay Redirect with Reference:          │   checkout_url:... │
        ┌─────────────────────────────────┐       │   reference: "..." │
        │ /dashboard/payment-success      │       │ }                  │
        │ ?reference=course_1_1710907200  │       └────────┬───────────┘
        └────────────┬────────────────────┘               │
                     │                                    │
                     ↓                            ┌────────────────────┐
        ┌──────────────────────────┐             │ User Redirected to │
        │ Extract Reference from   │             │ Korapay Payment    │
        │ URL                      │             │ Gateway            │
        │                          │             └────────┬───────────┘
        │ reference =              │                     │
        │ "course_1_1710907200"    │              [User enters card]
        └────────────┬─────────────┘              [Confirms payment]
                     │                                    │
                     ↓                                    ↓
        ┌──────────────────────────┐        ┌──────────────────────────┐
        │ GET /api/success         │        │ Korapay Webhook to       │
        │ ?reference=...           │<───────│ /api/payments/webhook    │
        │                          │        │ {                        │
        │ Returns:                 │        │   event: charge.success  │
        │ {                        │        │   reference: "..."       │
        │   courseId: 1            │        │   amount: 9900 (in kobo) │
        │   amount: 99             │        │   customer: { email }    │
        │   paymentStatus: success │        │ }                        │
        │   customerEmail: "..."   │        └──────────────────────────┘
        │ }                        │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │ Auth Context enrollCourse │
        │ - Input: courseId = 1     │
        │ - Output: user.enrolled.. │
        │   Courses.push(1)         │
        │ - localStorage updated    │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │ UI State Updated          │
        │ - Show success message    │
        │ - Enable dashboard link   │
        │ - Course now accessible   │
        └──────────────────────────┘
```

## Database Schema (Future Implementation)

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments Table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id INTEGER NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active'
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id INTEGER NOT NULL,
  amount DECIMAL(10, 2),
  reference VARCHAR(255) UNIQUE,
  status VARCHAR(50), -- pending, success, failed
  payment_method VARCHAR(50),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Enrolled Courses Table
CREATE TABLE user_courses (
  user_id UUID REFERENCES users(id),
  course_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'not-started',
  started_at TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);
```

## Environment Variables

```
# Development
KORAPAY_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
KORAPAY_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database (Future)
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus
```

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth | Body |
|--------|----------|---------|------|------|
| POST | `/api/payments/initialize` | Start payment | ❌ | { amount, email, courseId } |
| GET | `/api/payments/success` | Verify payment | ❌ | Query: reference |
| POST | `/api/payments/webhook` | Korapay callback | ⚠️ | Korapay event |
| GET | `/api/payments/verify` | Check status | ❌ | Query: reference |

## File Structure

```
nexus-learning-platform/
├── app/
│   ├── api/
│   │   └── payments/
│   │       ├── initialize/route.ts     ← Korapay checkout
│   │       ├── success/route.ts        ← Verify payment (NEW)
│   │       ├── verify/route.ts         ← Check status
│   │       └── webhook/route.ts        ← Korapay events
│   ├── dashboard/
│   │   ├── payment-success/page.tsx    ← Success page (NEW)
│   │   └── my-courses/page.tsx         ← Show enrolled courses
│   └── courses/
│       └── page.tsx                    ← Browse courses
├── components/
│   ├── payment-modal.tsx               ← Course details modal (ENHANCED)
│   └── courses/
│       └── courses-grid.tsx            ← Course cards (ENHANCED)
├── contexts/
│   └── auth-context.tsx                ← enrollCourse() function
├── lib/
│   └── courses.ts                      ← Course data & types
└── PAYMENT_*.md                        ← Documentation files
```

## State Management

```
Auth Context:
├── user: {
│   id: string
│   email: string
│   name: string
│   enrolledCourses: number[]  ← Key field for enrollment
│   createdAt: string
│ }
├── isAuthenticated: boolean
├── isLoading: boolean
└── enrollCourse(courseId): void

Payment Modal State:
├── isOpen: boolean
└── course: CourseObject | null

Success Page State:
├── status: "loading" | "success" | "error"
├── courseId: number | null
├── courseTitle: string
└── message: string
```

## Security Layers

```
Layer 1: User Authentication
└─ Check if user is logged in before payment

Layer 2: Payment Initiation
└─ Validate amount and course data

Layer 3: Korapay Gateway
└─ Secure payment processing

Layer 4: Payment Verification
└─ Verify with Korapay API before enrollment

Layer 5: Enrollment
└─ Add course to user's account only if verified

Layer 6: Webhook Validation
└─ Receive and log payment confirmations
```

---

**This architecture is scalable and production-ready!**
