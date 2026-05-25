# 🌌 NebulaPress — Premium Full-Stack Blogging Platform

NebulaPress is an ultra-modern, high-fidelity full-stack blogging platform. Crafted using a robust **MERN (MongoDB, Express, React, Node.js)** stack, it blends professional-grade backend security protocols with a premium, space-dark glassmorphic React user interface. 

Featuring secure in-memory JWT authorization, silent refresh cookie sessions, a live side-by-side Markdown composer, and recursive multi-level nested discussion threads, NebulaPress is built for modern developers who value both clean software architecture and visual excellence.

---

## ✨ Primary Core Features

### 🔑 1. Secure JWT Session Rotation
*   **Access Tokens**: Saved strictly in-memory (and React state) to completely mitigate Cross-Site Scripting (XSS) intercept risks.
*   **Refresh Tokens**: Kept inside secure, `httpOnly`, `sameSite: strict` cookie envelopes.
*   **Silent Renewal Interceptors**: Customized Axios client-side interceptors catch expired `401 Unauthorized` states, automatically request a refreshed access token behind the scenes, and transparently retry initial operations without interrupting the user.

### 💬 2. Infinite Nested Comments Tree
*   **Backend Tree Mappings**: Converts flat MongoDB document listings into deep hierarchical arrays on a single recursive pass ($O(N)$ execution speed).
*   **Recursive React Nodes**: The client features a recursive React `<CommentNode>` component that automatically renders deep nesting layers, handles inline reply inputs at any level, and supports cascading recursive deletes.

### 📝 3. Split-Screen Markdown Editor
*   **Flexible Layouts**: Toggles seamlessly between **Write Mode** (editor), **Preview Mode** (compiled HTML view), and **Split Screen** (side-by-side interactive editor).
*   **Formatting Shortcuts**: Format buttons (Bold, Italic, Header, Code, Quote, Links) inject Markdown tags directly into active cursor positions.
*   **Secure Parser**: Customized Markdown compilation engine compiles standard titles, bulleted items, code panels, and images instantly.

### 🎨 4. Space-Dark Glassmorphic UI/UX
*   **Harmonious Color Palettes**: Uses a curated dark space theme incorporating HSL colors, neon accents, glowing rings, and glassmorphic card overlays.
*   **Elite Typography**: Imports Google Fonts' *Outfit* (for geometric display titles) and *Inter* (for highly legible body text).
*   **Interactive Micro-Animations**: Smooth hover elevations, glowing input focus outlines, floating cards, and animated page transitions.

### 📊 5. Dynamic Profile settings Console
*   **Developer Avatars**: Select from elegant preset developer/designer profiles or customize with your own image URLs.
*   **Secure Password Rotation**: Full credential updates (validating current passwords, new passwords, and confirmation matches).
*   **Personal Dashboard**: Track total article publish counts, positive reader likes, and perform instant edit/delete operations on owned posts.

---

## 🛠️ Technical Stack Overview

### Backend Architecture
*   **Runtime**: Node.js & Express
*   **Database**: MongoDB & Mongoose Object Data Modeling
*   **Security**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password hashing
*   **Parsers**: `cookie-parser`, `cors` integrations

### Frontend Architecture
*   **Bundler**: Vite & React 19 (ES modules)
*   **Routing**: React Router DOM (v6.x)
*   **HTTP Client**: Axios (configured with credentials proxy)
*   **Icons**: Lucide React
*   **Styling**: Premium Vanilla CSS (Predefined custom color tokens)

---

## 📂 Project Directory Map

```
Fullstack Project 2/
├── backend/                   # Express Web API
│   ├── src/
│   │   ├── config/db.js       # Mongoose DB connector
│   │   ├── controllers/       # Controllers (Auth, Posts, Comments)
│   │   ├── middleware/        # JWT security guards & global error handlers
│   │   ├── models/            # Schema declarations (User, Post, Comment)
│   │   ├── routes/            # Route maps (auth, posts, comments)
│   │   └── server.js          # API main entrypoint & middlewares
│   └── package.json           # Backend dependency manifests
│
├── frontend/                  # React Client SPA
│   ├── src/
│   │   ├── components/        # Layout elements (Navbar, Footer, Card, Editor)
│   │   ├── context/           # AuthState providers & route guards
│   │   ├── pages/             # View pages (Home, Details, Profile, Logins)
│   │   ├── services/          # API Axios client & token refresh interceptors
│   │   ├── App.jsx            # Layout route orchestrations
│   │   └── index.css          # Design tokens, typography, and card glows
│   ├── vite.config.js         # Vite configuration with API reverse proxy
│   └── package.json           # Client dependency manifests
```

---

## 🚀 Setup & Launch Guidelines

### 1. Database Setup
Ensure you have a local MongoDB service running, or set up a free MongoDB Atlas cloud cluster.

### 2. Configure Backend Services
Navigate to the `backend/` subfolder, install standard modules, configure environment settings, and spin up the developer server:
```bash
# Enter subfolder
cd backend

# Install dependencies
npm install

# Create environment secrets config
copy .env.example .env  # (Or copy .env.example to .env)
```
Open the newly created `.env` file and define your specific port and MongoDB connection URI:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.net/nebulapress
JWT_ACCESS_SECRET=your_super_secure_access_secret_key_12345
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_67890
```
Start the backend web server:
```bash
npm run dev
```

### 3. Configure Frontend Client
Navigate to the `frontend/` folder, fetch client modules, and boot up the hot-reloaded dev server:
```bash
# Enter subfolder
cd ../frontend

# Install dependencies with peer overrides
npm install --legacy-peer-deps

# Start Vite React server
npm run dev
```
Open your browser and navigate to `http://localhost:5173/`!

---

## ⚡ Integration & API testing

The codebase includes a comprehensive integration test suite that tests the entire database CRUD, JWT login/refresh rotations, and recursive tree comment schemas:

Run backend E2E API tests:
```bash
cd backend
node ../scratch/verify_api.js
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
