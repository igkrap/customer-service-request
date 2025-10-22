# Customer Service Request Management System

A full-stack application for managing customer service requests, built with Spring Boot, React, and Microsoft SQL Server.

## Features

- Customer Management (CRUD operations)
- Service Request Management (CRUD operations)
- Request Status Tracking (Open, In Progress, Resolved, Closed, Cancelled)
- Priority Levels (Low, Medium, High, Urgent)
- RESTful API with Spring Boot
- Modern React UI
- Microsoft SQL Server database

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- Microsoft SQL Server
- Maven

### Frontend
- React 18
- Axios for API calls
- Modern CSS styling

### Database
- Microsoft SQL Server 2022
- Docker container support

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
- Docker and Docker Compose (for database)

## Setup Instructions

### 1. Database Setup

Start the Microsoft SQL Server using Docker:

```bash
docker-compose up -d
```

This will:
- Start MSSQL Server on port 1433
- Create the `CustomerServiceDB` database
- Set up the SA password as configured

### 2. Backend Setup

Navigate to the backend directory and run:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend server will start on `http://localhost:8080`

### 3. Frontend Setup

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

Edit `backend/src/main/resources/application.properties` to modify database settings:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=CustomerServiceDB
spring.datasource.username=sa
spring.datasource.password=YourStrong@Passw0rd
```

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

### Database Connection Issues

1. Ensure Docker container is running:
```bash
docker ps
```

2. Check SQL Server logs:
```bash
docker logs customer-service-mssql
```

3. Verify database exists:
```bash
docker exec -it customer-service-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd' -Q "SELECT name FROM sys.databases"
```

### Port Conflicts

If ports 8080, 3000, or 1433 are already in use, modify:
- Backend port: `server.port` in `application.properties`
- Frontend port: Set `PORT` environment variable
- Database port: Change port mapping in `docker-compose.yml`

## Security Notes

- The default SA password is for development only
- Change passwords in production environments
- Implement proper authentication/authorization
- Use environment variables for sensitive data

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
