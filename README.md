# AI Expense Tracker

## Project Structure
- `backend/`: Express.js server with MongoDB.
- `frontend/`: Next.js application with Tailwind CSS.

## How to Run

### prerequisites
- Node.js installed.
- MongoDB running locally (default: `mongodb://localhost:27017`).

### 1. Start the Backend
Open a terminal and run:
```bash
cd backend
npm install # Only first time
node index.js
```
The server will run on `http://localhost:5000`.

### 2. Start the Frontend
Open a **new** terminal and run:
```bash
cd frontend
npm install # Only first time
npm run dev
```
The application will run on `http://localhost:3000`.
