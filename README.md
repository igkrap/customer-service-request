# Service Request Management System

A full-stack application for managing service requests, built with Spring Boot, React, and SQLite.

## Features

- User Authentication & Authorization (JWT-based)
- Role-based Access Control (Admin & User roles)
- User Management (Admin only - view users, update roles, delete users)
- Service Request Management (CRUD operations - User & Admin)
- User-based Service Requests (Each request is associated with a user)
- Request Status Tracking (Open, In Progress, Resolved, Closed, Cancelled)
- Priority Levels (Low, Medium, High, Urgent)
- RESTful API with Spring Boot
- Modern React UI
- SQLite database (file-based, no server required)

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Security with JWT
- MyBatis 3.0.3
- SQLite (file-based database)
- Maven

### Frontend
- React 18
- Axios for API calls
- Modern CSS styling

### Database
- SQLite 3.44+ (embedded, no installation required)

## Project Structure

```
customer-service-request/
├── backend/                    # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/customerservice/
│   │   │   │   ├── controller/    # REST controllers
│   │   │   │   ├── service/       # Business logic
│   │   │   │   ├── mapper/        # MyBatis mapper interfaces
│   │   │   │   ├── model/         # Domain model classes
│   │   │   │   ├── dto/           # Data transfer objects
│   │   │   │   └── config/        # Configuration classes
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── schema.sql     # Database schema
│   │   └── test/
│   └── pom.xml
├── frontend/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API service layer
│   │   └── styles/            # CSS files
│   └── package.json
└── docker-compose.yml         # Docker configuration
```

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Node.js 16+ and npm
- (No database installation required - SQLite is embedded)

## Setup Instructions

### 1. Backend Setup

No database setup required! SQLite will automatically create the database file (`customer_service.db`) when the application starts.

Navigate to the backend directory and run:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend server will start on `http://localhost:8080`

The database file `customer_service.db` will be automatically created in the backend directory with a default admin account.

**Default Admin Account:**
- Username: `admin`
- Password: `1234`
- Role: `ROLE_ADMIN`

**Important:** Change the admin password after first login for security purposes.

### 2. Frontend Setup

Navigate to the frontend directory and run:

```bash
cd frontend
npm install
npm start
```

The React application will start on `http://localhost:3000`

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/signup` - Register a new user (Public)
- `POST /api/auth/login` - Login and get JWT token (Public)

### User Management Endpoints (Admin only)

- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}/role` - Update user role
- `DELETE /api/users/{id}` - Delete user

### Service Request Endpoints (User & Admin)

- `GET /api/service-requests` - Get all service requests (Admin sees all, users see only their own)
- `GET /api/service-requests/{id}` - Get request by ID
- `GET /api/service-requests/user/{userId}` - Get requests by user
- `GET /api/service-requests/status/{status}` - Get requests by status
- `GET /api/service-requests/priority/{priority}` - Get requests by priority
- `POST /api/service-requests` - Create new request
- `PUT /api/service-requests/{id}` - Update request
- `DELETE /api/service-requests/{id}` - Delete request

## Data Models

### User
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "ROLE_USER",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
}
```

### Signup Request
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login Request
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

### Auth Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "ROLE_USER"
}
```

### Service Request
```json
{
  "id": 1,
  "title": "Issue with product",
  "description": "Detailed description",
  "status": "OPEN",
  "priority": "HIGH",
  "userId": 1,
  "userName": "johndoe",
  "userEmail": "john@example.com",
  "assignedTo": "Support Team",
  "createdByUserId": 1,
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00",
  "resolvedAt": null
}
```

### Status Values
- OPEN
- IN_PROGRESS
- RESOLVED
- CLOSED
- CANCELLED

### Priority Values
- LOW
- MEDIUM
- HIGH
- URGENT

### User Roles
- `ROLE_USER` - Regular user with access to service requests
- `ROLE_ADMIN` - Administrator with full access to all features including customer management

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected endpoints:

1. **Sign up** or **Login** to get a JWT token
2. Include the token in the `Authorization` header of your requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### Example Usage

```bash
# 1. Login with default admin account
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'

# Response will include JWT token
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","type":"Bearer",...}

# 2. Sign up new user
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"password123"}'

# 3. Use token to access protected endpoint
curl -X GET http://localhost:8080/api/service-requests \
  -H "Authorization: Bearer <your-jwt-token>"

# 4. Admin: Manage user roles
curl -X PUT http://localhost:8080/api/users/2/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"ROLE_ADMIN"}'
```

### Access Control

- **Public Endpoints**: `/api/auth/signup`, `/api/auth/login`
- **User & Admin**: `/api/service-requests/**` (Users can only view/edit their own requests)
- **Admin Only**: `/api/users/**` (Full access to all service requests)

## Configuration

### Database Connection

The database is configured in `backend/src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:sqlite:customer_service.db
spring.datasource.driver-class-name=org.sqlite.JDBC

# MyBatis Configuration
mybatis.mapper-locations=classpath:mapper/**/*.xml
mybatis.type-aliases-package=com.example.customerservice.model
mybatis.configuration.map-underscore-to-camel-case=true
```

The database file (`customer_service.db`) will be created automatically in the backend directory when the application starts for the first time. The database schema is defined in `backend/src/main/resources/schema.sql` and is executed automatically on startup.

### MyBatis Mappers

This project uses MyBatis with annotation-based SQL mapping. Mapper interfaces are located in the `mapper` package:
- `UserMapper.java` - CRUD operations for users
- `ServiceRequestMapper.java` - CRUD operations for service requests

SQL queries are defined using `@Select`, `@Insert`, `@Update`, and `@Delete` annotations directly on the mapper interface methods.

### CORS Configuration

The backend is configured to allow requests from `http://localhost:3000`. Modify `WebConfig.java` to change allowed origins.

## Development

### Running Tests

Backend tests:
```bash
cd backend
mvn test
```

Frontend tests:
```bash
cd frontend
npm test
```

### Building for Production

Backend:
```bash
cd backend
mvn clean package
java -jar target/customer-service-0.0.1-SNAPSHOT.jar
```

Frontend:
```bash
cd frontend
npm run build
```

## Troubleshooting

### Database Issues

1. Check if database file exists:
```bash
ls -la backend/customer_service.db
```

2. If you need to reset the database, simply delete the file:
```bash
rm backend/customer_service.db
```

3. View database contents using SQLite CLI:
```bash
sqlite3 backend/customer_service.db
.tables
SELECT * FROM users;
SELECT * FROM service_requests;
.quit
```

### Port Conflicts

If ports 8080 or 3000 are already in use, modify:
- Backend port: `server.port` in `application.properties`
- Frontend port: Set `PORT` environment variable

## Security Notes

- SQLite is file-based and intended for development/small deployments
- For production with high concurrency, consider PostgreSQL or MySQL
- Implement proper authentication/authorization
- Protect the database file with appropriate file system permissions

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
