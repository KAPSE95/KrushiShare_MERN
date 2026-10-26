# KrushiShare — Full Stack MERN CRUD

A farm-equipment sharing marketplace built with React, Node.js, Express, and MongoDB.

## Features
- Farmer registration and login (passwords hashed with bcrypt).
- JWT authentication for equipment create/update/delete operations.
- Browse and search equipment listings.
- Add, view, edit/update, and delete equipment (CRUD).
- Listings are stored in MongoDB; no browser localStorage is used for equipment records.
- Responsive React interface.
- Each listing is linked to the authenticated owner. Only its owner can update/delete it.

## Requirements
- Node.js (LTS recommended)
- npm
- MongoDB Community Server running locally OR a MongoDB Atlas connection string.

## Setup (Windows / VS Code)

### 1. Extract and open the folder
Extract `KrushiShare_MERN.zip`, then open the `KrushiShare_MERN` folder in VS Code.

### 2. Configure the backend
Open `backend/.env.example`, copy it to `backend/.env`, then update `MONGODB_URI` and `JWT_SECRET`.

Local MongoDB example:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/krushishare
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```
Make sure MongoDB is installed and running. For MongoDB Atlas, use your Atlas connection string as `MONGODB_URI`.

### 3. Install dependencies
In the project root terminal:
```bash
npm install
npm run install:all
```
Or install separately:
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 4. Start the app
From the project root:
```bash
npm run dev
```
Frontend: `http://localhost:5173`
Backend health check: `http://localhost:5000/api/health`

If starting separately, open two terminals:
```bash
cd backend
npm run dev
```
and:
```bash
cd frontend
npm run dev
```

## How to test
1. Open `http://localhost:5173`.
2. Register a farmer account, then log in.
3. Use **Add equipment** to create a listing.
4. Search or browse the equipment cards.
5. On your own listing, click **Edit** to update it.
6. Click **Delete** and confirm to remove it.
7. Refresh the page; listings are retrieved from MongoDB.

## API endpoints
- `GET /api/health` — backend/database status
- `POST /api/auth/register` — register user
- `POST /api/auth/login` — login user
- `GET /api/auth/me` — current logged-in user (requires bearer token)
- `GET /api/equipment` — list equipment (public)
- `GET /api/equipment/:id` — equipment details (public)
- `POST /api/equipment` — create listing (auth required)
- `PUT /api/equipment/:id` — update own listing (auth required)
- `DELETE /api/equipment/:id` — delete own listing (auth required)

## Important
- Do not commit `.env` or share your JWT secret.
- This is an educational starter project. Before production, add rate limiting, email verification, password reset, stronger input validation, logging, and deployment-specific security configuration.
- MongoDB must be running and `backend/.env` must be configured before database-backed features can work.
