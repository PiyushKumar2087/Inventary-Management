# Inventory & Order Management System

A modernized, full-stack SaaS web application designed for managing products, customers, and orders. The project is fully containerized using Docker, utilizing a Flask-native backend, a React frontend, and a PostgreSQL database.

---

## Key Features

*   **Premium UI & Brand Experience**: Rebranded design featuring a custom 3D isometric package logo and a dynamic theme switcher with four curated color palettes (Midnight Blue, Light Modern, Emerald Dark, Retro Rose) persisted locally.
*   **Dynamic Search & Filtering**:
    *   **Products**: Filter by stock status using inline funnel controls, and search by SKU, name, or description.
    *   **Customers**: Search by customer name, email, or phone number.
    *   **Orders**: Search by customer name, email, or Order ID (e.g. `#ORD-1`).
*   **Header-Integrated Sorting**: Clean SaaS table sorting (Ascending, Descending, Unsorted) integrated directly into table headers for Price, Stock, Items Count, and Total Amount.
*   **Consistent Pagination**: Unified 10-item-per-page client-side pagination with automatic page bounds validation (automatically redirects to the last valid page if deletion empties the current view).
*   **Asymmetric Dashboard**: A grid layout showcasing key metrics alongside a scroll-contained Low Stock alerts panel.

---

## Tech Stack

### Backend
*   **Flask** (Python 3.12)
*   **SQLAlchemy** (ORM)
*   **Manual Validation** (Explicit custom validation engine replacing Pydantic dependencies)
*   **Flask Development Server** (Native, debug-reload active server)

### Frontend
*   **React** (Vite SPA)
*   **Vanilla CSS** (Responsive variables and dynamic theme mapping)
*   **Nginx** (Serving the static React build inside Docker)

### Database & DevOps
*   **PostgreSQL 16** (Database)
*   **Docker & Docker Compose** (Containerization & healthcheck-ordered startup)

---

## Local Setup & Installation

### Prerequisites
Make sure you have the following installed on your machine:
*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Running the Application
1.  **Clone the repository** and navigate to the project root directory:
    ```bash
    git clone https://github.com/PiyushKumar2087/Inventary-Management.git
    cd Inventary-Management
    ```

2.  **Start the containers**:
    ```bash
    docker-compose up --build -d
    ```

3.  **Verify that the containers are running**:
    ```bash
    docker ps
    ```
    You should see three running containers:
    *   `inventory_db_container` (PostgreSQL)
    *   `inventory_backend_container` (Flask native)
    *   `inventory_frontend_container` (React / Nginx)

---

## Application Endpoints

Once running locally, the services are accessible at:

*   **Frontend App:** [http://localhost:8080](http://localhost:8080)
*   **Backend API Base:** [http://localhost:8000](http://localhost:8000)

---

## Accessing the Local Database

If you want to view, inspect, or modify tables in your local PostgreSQL container:

### Using a GUI Client (DBeaver, TablePlus, Beekeeper Studio)
Create a new PostgreSQL connection with:
*   **Host:** `localhost`
*   **Port:** `5433` *(Mapped to host port 5433 to prevent conflicts with native postgres instances)*
*   **Username:** `postgres`
*   **Password:** `postgres`
*   **Database:** `inventory_db`

---

## Deployment

### Backend & Database (Render)
*   **Database:** Managed PostgreSQL instance on Render.
*   **API Service:** Hosted on Render using the Python runtime. Set the `DATABASE_URL` environment variable to Render's **Internal Connection String** for security and speed.

### Frontend (Netlify)
*   Build configuration: `npm run build`
*   Publish directory: `dist`
*   Client-side routing is configured using custom redirects (`_redirects` / `netlify.toml`).
