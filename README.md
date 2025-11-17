WeTalk

WeTalk is a lightweight social platform for building your personal IP (social persona) through posts and public or private comments.

Tech stack:
- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)
- Auth: JWT-based login
- Hot Topic: shows the most-commented post

Live demo:
https://wetalk-woad.vercel.app/

Local development:

1) Backend
- cd backend
- npm install
- set MONGO_URI and JWT_SECRET in backend/.env
- npm run dev
Backend runs on http://localhost:5000

2) Frontend
- cd frontend
- npm install
- create frontend/.env.local with:
  VITE_BASE_URL=http://localhost:5000/api
- npm run dev
Frontend runs on http://localhost:5173
