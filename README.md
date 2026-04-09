#  Yum —Rental & Stay Platform

A full-stack MERN rental platform built for Manipur, India.

##  Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Seed admin account (run once):
```bash
node seedAdmin.js
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

Register new accounts as **User** or **Owner** via the app.

---

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | Node.js + Express.js          |
| Database | MongoDB + Mongoose            |
| Auth     | JWT + bcryptjs                |
| Upload   | Multer (Cloudinary)           |


---


## 🌐 API Endpoints

| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET | /api/listings | Public |
| GET | /api/listings/:id | Public |
| POST | /api/listings | Owner/Admin |
| PUT | /api/listings/:id | Owner/Admin |
| DELETE | /api/listings/:id | Owner/Admin |
| GET | /api/admin/stats | Admin |
| GET | /api/admin/listings | Admin |
| PATCH | /api/admin/listings/:id/approve | Admin |
| GET | /api/admin/users | Admin |

---

##  Features

- ✅ Mobile-first responsive design
- ✅ JWT authentication (user / owner / admin roles)
- ✅ Listing CRUD with image upload (up to 6 photos)
- ✅ Search + filter (category, district, price, status)
- ✅ Admin approval workflow
- ✅ Image carousel with lightbox
- ✅ Pagination
