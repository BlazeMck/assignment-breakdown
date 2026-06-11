# Assignment Backend API

Backend API for the Assignment Breakdown application using Express.js and a Supabase-compatible data layer.

The server supports:
- assignment CRUD
- task CRUD nested under assignments
- request validation
- consistent error handling
- Supabase or local PostgreSQL development

## Project Structure

```
server/
├── config/
│   └── database.js            # Supabase client or local Postgres adapter
├── routes/
│   ├── assignments.js         # Assignment CRUD endpoints
│   └── tasks.js               # Task CRUD endpoints nested under assignments
├── validators/
│   ├── assignmentValidator.js # Assignment validation schemas
│   └── taskValidator.js       # Task validation schemas
├── middleware/
│   └── errorHandler.js        # Centralized error handling
├── scripts/
│   └── seed.js                # Database seeding
├── __tests__/
│   ├── validators.test.js
│   ├── tasks.validators.test.js
│   ├── assignments.integration.test.js
│   ├── tasks.integration.test.js
│   └── errorHandling.test.js
├── server.js                  # Express server setup
├── jest.config.js             # Jest configuration
└── package.json               # Dependencies and scripts
```

## Prerequisites

- Node.js 16+
- Docker for the local database
- npm

## Setup

### 1. Start the database

```bash
# From the project root
docker-compose up -d
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Seed test data

```bash
npm run seed
```

If you are running from the repo root, use:

```bash
npm run server:seed
```

## Configuration

Create a `.env` file from the example file and adjust values if needed:

```bash
cp .env.example .env
```

Environment variables:

- `PORT` - Server port, defaults to `3001`
- `SUPABASE_URL` - Supabase URL, or `http://localhost:54321` for the local API
- `SUPABASE_ANON_KEY` - Supabase anon key
- `DATABASE_URL` - Optional direct Postgres connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Direct local Postgres configuration

The server supports two local development modes:

1. Supabase runtime with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Direct local PostgreSQL access with `DB_*` or `DATABASE_URL`

If `SUPABASE_URL` points to the raw Postgres port (`54322`), the server falls back to the local Postgres adapter instead of expecting a Supabase API.

## Running the Server

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The server runs on `http://localhost:3001`.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-08T10:00:00.000Z"
}
```

### Assignments

`GET /api/assignments` returns assignment records only. It does not include tasks.

```http
POST /api/assignments
GET /api/assignments
GET /api/assignments/:id
PUT /api/assignments/:id
DELETE /api/assignments/:id
```

#### Create Assignment

Request:

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "raw_text": "Complete project documentation",
  "title": "Documentation",
  "due_date": "2026-06-15T23:59:59Z"
}
```

#### Get All Assignments

Optional query:

```http
GET /api/assignments?user_id=550e8400-e29b-41d4-a716-446655440000
```

#### Get Assignment by ID

```http
GET /api/assignments/a550e840-0e29-b41d-4a71-644665544000
```

#### Update Assignment

```json
{
  "title": "Updated Documentation",
  "due_date": "2026-06-20T23:59:59Z"
}
```

#### Delete Assignment

```http
DELETE /api/assignments/a550e840-0e29-b41d-4a71-644665544000
```

### Tasks

Tasks are nested under assignments and are fetched separately from the assignment list.

```http
POST /api/assignments/:assignmentId/tasks
GET /api/assignments/:assignmentId/tasks
PUT /api/assignments/:assignmentId/tasks/:taskId
DELETE /api/assignments/:assignmentId/tasks/:taskId
```

#### Create Task

Task creation requires an existing assignment.

```json
{
  "description": "Read chapter 4",
  "priority": 1,
  "time_estimate": 60,
  "status": "pending"
}
```

Allowed task statuses:
- `pending`
- `in_progress`
- `completed`

#### Get Tasks for an Assignment

Returns all tasks for the assignment ordered by priority.

#### Update Task

Partial updates are supported. At least one field is required.

#### Delete Task

Deletes a task only if it belongs to the given assignment.

## Validation Rules

### Assignments

- `user_id` must be a UUID
- `raw_text` is required
- `title` is required and must be 1-255 characters
- `due_date` must be a valid ISO date

### Tasks

- `description` is required and must be non-empty
- `priority` is required and must be an integer
- `time_estimate` is optional and must be a non-negative integer when provided
- `status` is required and must be one of `pending`, `in_progress`, or `completed`
- `assignmentId` and `taskId` must be valid UUIDs

### Nested Resource Rules

- The assignment must exist before creating or listing tasks
- The task must belong to the assignment before updating or deleting it

## Error Handling

The API returns consistent JSON error responses:

### Validation Error

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "title",
      "message": "\"title\" is required"
    }
  ]
}
```

### Not Found

```json
{
  "success": false,
  "error": "Assignment not found"
}
```

or

```json
{
  "success": false,
  "error": "Task not found"
}
```

### Database Connection Failure

```json
{
  "success": false,
  "error": "Service Unavailable",
  "message": "Database connection failed. Start the local database with `docker-compose up -d` and try again."
}
```

## Database Schema

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Assignments

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL,
  time_estimate INTEGER,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Testing Notes

- The backend test suite covers assignment validators, task validators, assignment endpoints, task endpoints, and error handling.
- Tests use mocked Supabase calls so they can run without a live database.

## Notes

- `GET /api/assignments` is intentionally assignment-only for overview pages.
- Task details should be fetched with `GET /api/assignments/:assignmentId/tasks`.
- Seed data includes example assignments and tasks for local development.
