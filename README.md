
<div align="center">
  <img src="assets/banner.png" alt="KharchaBuddy Banner" width="100%" style="max-width: 500px;" />
  
  <br /><br />
  
  <p>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-blue?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js" /></a>
    <a href="https://mongodb.com"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" /></a>
  </p>
</div>

<br />

> **KharchaBuddy** is a modern, AI-driven financial tracking application designed to help you take control of your expenses with ease. Featuring interactive dashboards, real-time analytics, and intelligent categorization.

---

## 📸 Dashboard & Analytics

### Monthly Expense Trend
Visualize your spending habits with our interactive Annual and Monthly trend graphs.

*(Trend graph visualization available in the application)*

---

## ✨ Key Features

- **🤖 AI-Powered Insights**: Smart categorization and spending analysis.
- **📊 Interactive Analytics**: Beautiful charts for monthly trends, category breakdowns, and more.
- **🔐 Secure Authentication**: Robust user management with JWT and secure password hashing.
- **📱 Responsive Design**: Fully optimized for desktop, tablet, and mobile devices.
- **🌙 Dark Mode**: Sleek, modern dark-themed UI for comfortable viewing.
- **⚡ Real-time Updates**: Instant reflection of new expenses and budget adjustments.

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/SameerMahato/KharchaBuddy.git
    cd KharchaBuddy
    ```

2.  **Install Dependencies**
    ```bash
    # Install backend dependencies
    cd backend
    npm install

    # Install frontend dependencies
    cd ../frontend
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the `backend` directory:
    ```env
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    PORT=5000
    ```

4.  **Run the Application**
    ```bash
    # Run Backend
    cd backend
    node index.js

    # Run Frontend (in a new terminal)
    cd frontend
    npm run dev
    ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

<div align="center">
  <p>Made with ❤️ by Sameer Mahato</p>
</div>
