# LaunchPulse 🚀 — Product Hunt Clone

LaunchPulse is a premium, high-aesthetic Product Hunt clone designed with a **Next.js (App Router)** frontend, styled with **Tailwind CSS v4**, powered by a **FastAPI** backend, and backed by **PostgreSQL** (with an automatic **SQLite fallback** for immediate local development).

## Features
* **Today's Launches & Historical Grouping:** Chronologically organized products grouped into "Today's Launches", "Yesterday", and "Earlier Launches" exactly like Product Hunt.
* **Responsive Category Filtering & Live Search:** Smooth filter Pills and live searches that instantly restrict lists, supported by glowing skeleton loaders.
* **Sticky Top Trending Sidebar:** Compact top-voted product list with rank badges on the side.
* **Satisfying Interactive Upvotes:** Upvote triggers feature scale-up animations, optimistic instant UI count updates, and database persistent calls.
* **Double-Vote Locks:** Utilizes `localStorage` keys to remember which products the active browser already voted on, displaying a beautiful glowing indigo gradient state.
* **Background Data Sync Service:** Runs a background cron process every 30 minutes to fetch latest posts from the official Product Hunt API.
* **Zero-Config Seed Fallback:** If Product Hunt keys are left blank, LaunchPulse automatically seeds the database with a curated catalog of ~14 stunning tech products, making the first load immediately beautiful.

---

## Project Structure
```
e:\new_product_launch/
├── backend/
│   ├── app/
│   │   ├── config.py         # Config loader using pydantic-settings
│   │   ├── database.py       # DB engine with SQLite auto-fallback logic
│   │   ├── models.py         # SQLAlchemy Product model
│   │   ├── schemas.py        # Pydantic validation schemas
│   │   ├── crud.py           # CRUD DB queries (with vote incrementers & upserts)
│   │   ├── product_hunt.py   # Product Hunt GraphQL API fetcher & Mock Seeder
│   │   ├── scheduler.py      # Background cron manager running every 30 mins
│   │   └── main.py           # FastAPI server endpoints & CORS middleware
│   ├── .env                  # Live config variables
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css   # Tailwinds tokens, grids, & blur-glass helpers
│   │   │   ├── layout.tsx    # Persistent root shell + SEO meta headers
│   │   │   ├── page.tsx      # Main launches dashboard & filters
│   │   │   └── products/     # Dynamic route for details page
│   │   └── components/
│   │       ├── Navbar.tsx    # Glassmorphic header & "Sync Database" button
│   │       ├── ProductCard.tsx # Listing card with voting micro-animations
│   │       └── Skeleton.tsx  # Pulse skeletons for layout shimmers
│   └── package.json
└── README.md                 # Project user manual
```

---

## Getting Started

### 1. Prerequisite Checks
Make sure you have **Node.js** (v18+) and **Python** (v3.10+) installed.

---

### 2. Launching the Backend API (FastAPI)

1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd e:/new_product_launch/backend
   ```
2. Activate the pre-created virtual environment:
   * **Windows PowerShell:**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows Command Prompt (cmd):**
     ```cmd
     venv\Scripts\activate.bat
     ```
3. Boot the FastAPI dev server using Uvicorn:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will start at `http://localhost:8000`. You can inspect the interactive OpenAPI Swagger docs at `http://localhost:8000/docs`.*
   *On boot, the server automatically starts the 30-minute scheduler and seeds/syncs the database.*

---

### 3. Launching the Frontend App (Next.js)

1. Open a second terminal window and navigate to the frontend folder:
   ```bash
   cd e:/new_product_launch/frontend
   ```
2. Run the Next.js local development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000`. 
   *Discover beautiful obsidian designs, try upvoting, select category tags, and search launches!*

---

## Advanced Configurations (Optional)

### Configuring PostgreSQL Database
By default, the backend falls back to SQLite, creating a `product_hunt.db` file in `/backend`. To connect your own PostgreSQL server:
1. Open the `/backend/.env` file.
2. Edit the `DATABASE_URL` line:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
   ```
3. Restart the FastAPI server. The database tables will be created automatically on startup.

### Integrating Real Product Hunt Launches
To pull actual live posts from Product Hunt:
1. Go to the [Product Hunt API Dashboard](https://www.producthunt.com/v2/oauth/applications) and create an application to generate a **Client ID** and **Client Secret**.
2. Open `/backend/.env` and update the keys:
   ```env
   PRODUCT_HUNT_CLIENT_ID=your_client_id_here
   PRODUCT_HUNT_CLIENT_SECRET=your_client_secret_here
   ```
3. Restart the FastAPI server, or click the **Sync Launches** button in the top right of the LaunchPulse header! The system will authorize, connect to Product Hunt's GraphQL API, pull the latest posts, and update the catalog!
