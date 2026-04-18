# Task Management System

Short version: this is a React + Express + MongoDB task manager with JWT auth, role-based access, task CRUD, document uploads, and Swagger docs.

## What It Does

- Users can sign up, log in, and manage tasks
- Admins can manage users
- Tasks support filtering, sorting, pagination, stats, and document upload/delete
- The backend exposes a REST API and Swagger UI

## APIs You Need To Expose

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/change-password`

### Users

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/bulk-update`

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/stats`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/documents`
- `DELETE /api/tasks/:taskId/documents/:documentId`

## Links / Config Needed For Deployment

### Backend

- Backend base URL: your deployed API domain, for example `https://api.yourapp.com`
- Swagger docs URL: `https://api.yourapp.com/api-docs`
- MongoDB URI: MongoDB Atlas connection string or other hosted MongoDB URL
- JWT secret: a strong production secret
- CORS origin: your deployed frontend URL, for example `https://yourapp.com`

### Frontend

- Frontend URL: your deployed web app URL, for example `https://yourapp.com`
- API URL: `https://api.yourapp.com/api`
- Supabase URL: your Supabase project URL
- Supabase publishable key: your public Supabase key

### Important Note

- The frontend dashboard uses Supabase client config from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The app also needs the backend API URL in `VITE_API_URL`.
- Uploaded files are currently stored on the backend filesystem, so keep persistent storage or move uploads to cloud storage if you deploy on a platform with ephemeral disk.

## Minimal Setup

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Docker

```bash
docker-compose up --build
```

Default local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger: http://localhost:5000/api-docs
