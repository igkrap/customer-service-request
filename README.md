# Customer Service Request Management System

A full-stack application for managing customer service requests, built with Spring Boot, React, and SQLite.

## Features

- Customer Management (CRUD operations)
- Service Request Management (CRUD operations)
- Request Status Tracking (Open, In Progress, Resolved, Closed, Cancelled)
- Priority Levels (Low, Medium, High, Urgent)
- RESTful API with Spring Boot
- Modern React UI
- SQLite database (file-based, no server required)

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
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
│   │   │   │   ├── repository/    # Data access layer
│   │   │   │   ├── model/         # Entity classes
│   │   │   │   ├── dto/           # Data transfer objects
│   │   │   │   └── config/        # Configuration classes
│   │   │   └── resources/
│   │   │       └── application.properties
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

The database file `customer_service.db` will be automatically created in the backend directory.

### 2. Frontend Setup

Navigate to the frontend directory and run:

```bash
cd frontend
npm install
npm start
```

The React application will start on `http://localhost:3000`

## API Endpoints

### Customer Endpoints

- `GET /api/customers` - Get all customers
- `GET /api/customers/{id}` - Get customer by ID
- `GET /api/customers/email/{email}` - Get customer by email
- `POST /api/customers` - Create new customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Service Request Endpoints

- `GET /api/service-requests` - Get all service requests
- `GET /api/service-requests/{id}` - Get request by ID
- `GET /api/service-requests/customer/{customerId}` - Get requests by customer
- `GET /api/service-requests/status/{status}` - Get requests by status
- `GET /api/service-requests/priority/{priority}` - Get requests by priority
- `POST /api/service-requests` - Create new request
- `PUT /api/service-requests/{id}` - Update request
- `DELETE /api/service-requests/{id}` - Delete request

## Data Models

### Customer
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "555-1234",
  "company": "Acme Corp",
  "createdAt": "2024-01-01T10:00:00",
  "updatedAt": "2024-01-01T10:00:00"
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
  "customerId": 1,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "assignedTo": "Support Team",
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

## Configuration

### Database Connection

The database is configured in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:sqlite:customer_service.db
spring.datasource.driver-class-name=org.sqlite.JDBC
```

The database file (`customer_service.db`) will be created automatically in the backend directory when the application starts for the first time.

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
SELECT * FROM customers;
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
