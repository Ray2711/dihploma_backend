### Resume API Backend

Express.js backend for user authentication (JWT) and resume management with PostgreSQL.

### Features  
- User registration and login with JWT-based authentication  
- Secure password hashing with bcrypt  
- Store and retrieve resume data (JSONB) per user  
- Create or update resume via a single endpoint  

### Prerequisites  
- Node.js v14+  
- PostgreSQL 10+  

### Installation  

1. Clone the repository  
   ```bash
   git clone https://github.com/Ray2711/dihploma_backend.git
   ```  
2. Install dependencies  
   ```bash
   npm install
   ```  
3. Create a `.env` file in the project root (see **Environment Variables** below)  
4. Initialize the database  
   ```bash
   psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f db_init.sql
   ```  
   Example:
   ```bash
   psql -h localhost -U postgres -d db_resume -f db_init.sql
   ```
5. Start the server  
   ```bash
   npm start
   ```  
   By default, the server listens on `http://localhost:3000`

### Environment Variables  
Create a `.env` file containing:
  
| Variable         | Description                                |
|------------------|--------------------------------------------|
| PORT             | Server port (e.g. `3000`)                  |
| DB_HOST          | PostgreSQL host (e.g. `localhost`)         |
| DB_PORT          | PostgreSQL port (e.g. `5432`)              |
| DB_USER          | PostgreSQL username                        |
| DB_PASSWORD      | PostgreSQL password                        |
| DB_NAME          | PostgreSQL database name                   |
| JWT_SECRET       | Secret key for signing JWTs                |
| TOKEN_EXPIRES_IN | JWT expiration interval (e.g. `1h`, `24h`) |

Example:
```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=supersecretkey
TOKEN_EXPIRES_IN=1h
```

### Database Setup  
Run `db_init.sql` to create the necessary tables:

```sql
-- db_init.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email    VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS resumes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_data JSONB
);
```

### API Documentation  

#### POST /api/auth/register  
Register a new user.  
- Request Body (application/json):
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- Responses:  
  • 201 Created  
    ```json
    {
      "user": {
        "id": 1,
        "username": "johndoe",
        "email": "john@example.com"
      }
    }
    ```  
  • 400 Bad Request (missing fields or user exists)  
  • 500 Server Error  

#### POST /api/auth/login  
Authenticate and receive a JWT.  
- Request Body (application/json):
  ```json
  {
    "emailOrUsername": "johndoe",
    "password": "password123"
  }
  ```
- Responses:  
  • 200 OK  
    ```json
    {
      "token": "<JWT_TOKEN>"
    }
    ```  
  • 400 Invalid credentials  
  • 500 Server Error  

#### POST /api/resume  
Create or update the authenticated user's resume.  
- Headers:  
  `Authorization: Bearer <JWT_TOKEN>`  
- Request Body (application/json):  
  Must follow this schema:
  ```json
  {
    "personal": {
      "fullName": "",
      "email": "",
      "profession": "",
      "address": "",
      "city": "",
      "state": ""
    },
    "education": {
      "schoolName": "",
      "schoolLocation": "",
      "degree": "",
      "fieldOfStudy": "",
      "gradMonth": "",
      "gradYear": ""
    },
    "experience": {
      "company": "",
      "employer": "",
      "role": "",
      "address": "",
      "startDate": "",
      "finishDate": "",
      "currentlyHere": false
    },
    "skills": ["", "", "", "", ""],
    "certifications": ["", "", ""],
    "contact": {
      "phone": "",
      "linkedin": "",
      "twitter": "",
      "github": "",
      "portfolio": ""
    }
  }
  ```
- Responses:  
  • 201 Created (first-time)  
    ```json
    { "message": "Resume created." }
    ```  
  • 200 OK (update)  
    ```json
    { "message": "Resume updated." }
    ```  
  • 401 Unauthorized (missing/invalid token)  
  • 500 Server Error  

#### GET /api/resume  
Retrieve the authenticated user's resume.  
- Headers:  
  `Authorization: Bearer <JWT_TOKEN>`  
- Responses:  
  • 200 OK  
    ```json
    { /* resume JSON as above */ }
    ```  
  • 404 Not Found (no resume)  
  • 401 Unauthorized  
  • 500 Server Error  

