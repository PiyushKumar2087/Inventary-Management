# Inventory & Order Management System

A full-stack web application designed for managing products, customers, and orders. The project is containerized using Docker and features a Flask backend, a React frontend, and a PostgreSQL database.

---

## Tech Stack

### Backend
* **Flask** (Python 3.12)
* **SQLAlchemy** (ORM)
* **Pydantic** (Data validation & settings management)
* **Gunicorn** (WSGI HTTP server)


### Frontend
* **React** (Vite SPA)
* **Vanilla CSS** (Responsive and modern design styling)

### Database & Devops
* **PostgreSQL 16** (Database)
* **Docker & Docker Compose** (Containerization)
* **Render** (Production Database & API hosting)
* **Netlify** (Production Frontend hosting)

---

## Local Setup & Installation

### Prerequisites
Make sure you have the following installed on your machine:
* [Docker](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/install/)

### Running the Application
1. **Clone the repository** and navigate to the project root directory:
   ```bash
   cd inventoryManagement
   ```

2. **Configure Environment Variables** (Optional):
   A default `.env` file is provided in the root directory. You can customize the credentials for local database connection if needed.

3. **Start the containers**:
   ```bash
   sudo docker compose up -d --build
   ```

4. **Verify that the containers are running**:
   ```bash
   sudo docker ps
   ```
   You should see three running containers:
   * `inventory_db_container` (PostgreSQL)
   * `inventory_backend_container` (Flask)
   * `inventory_frontend_container` (React / Nginx)

---

## Application Endpoints

Once running locally, the services are accessible at:

* **Frontend App:** [http://localhost:8080](http://localhost:8080)
* **Backend API Base:** [http://localhost:8000](http://localhost:8000)


---

## Accessing the Local Database

If you want to view, inspect, or modify tables in your local PostgreSQL container:

### Option A: Using Command Line (`psql`)
If `postgresql-client` is installed locally:
```bash
psql "postgresql://postgres:postgres@localhost:5432/inventory_db"
```

### Option B: Using a GUI (DBeaver, TablePlus, Beekeeper Studio)
Create a new PostgreSQL connection with:
* **Host:** `localhost`
* **Port:** `5432`
* **Username:** `postgres`
* **Password:** `postgres`
* **Database:** `inventory_db`

---

## Deployment

### Backend & Database (Render)
* **Database:** Managed PostgreSQL instance on Render.
* **API Service:** Hosted on Render using the Python runtime. Set the `DATABASE_URL` environment variable to Render's **Internal Connection String** for security and speed.

### Frontend (Netlify)
* Build configuration: `npm run build`
* Publish directory: `dist`
* Client-side routing is configured using custom redirects (`_redirects` / `netlify.toml`).
