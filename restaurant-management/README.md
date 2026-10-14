# Restaurant Management System

A backend REST API for managing restaurant operations, including users, authentication, recipes, ingredients, inventory, purchases, orders, payments, tables, stock movements, alerts, and reports.

## Technologies

* Java 21
* Spring Boot 4.1.1
* Spring Security
* JWT Authentication
* Spring Data JPA
* Hibernate
* MySQL
* Maven
* Jakarta Bean Validation
* Lombok
* Postman

## Main Features

### Authentication & Authorization

* User registration
* User login
* JWT-based authentication
* Role-based authorization
* Customer-specific access control
* BCrypt password encryption

### Recipe Management

* Create and manage recipes
* Manage recipe ingredients
* Recipe availability
* Recipe pricing

### Ingredient & Inventory Management

* Ingredient management
* Automatic inventory creation
* Stock quantity tracking
* Stock status tracking
* Low-stock detection
* Stock alerts
* Stock movements

### Purchase Management

* Record ingredient purchases
* Track purchase quantity and price
* Supplier information
* Purchase history
* Purchase cost reports

### Table Management

* Restaurant table management
* Table capacity
* Available, occupied and reserved statuses

### Order Management

* Create restaurant orders
* Order items
* Dine-in and other order types
* Order status management
* Inventory consumption integration

### Payment Management

* Payment creation
* Payment status management
* Payment methods
* Order-payment relationship
* Refund status support

### Reports

* Daily sales
* Weekly sales
* Monthly sales
* Completed order count
* Average order value
* Purchase reports
* Purchase cost
* Best-selling recipes
* Inventory reports
* Low-stock reports
* Stock movement reports

### Validation & Exception Handling

* Jakarta Bean Validation
* Request validation
* Global exception handling
* 400 Bad Request handling
* 404 Not Found handling
* 401 Unauthorized handling
* 403 Forbidden handling

## Project Architecture

The application follows a layered architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
MySQL Database
```

### Main Packages

```text
restaurant_management
├── config
├── controller
├── dto
├── entity
├── enums
├── exception
├── repository
├── security
└── service
    └── impl
```

## Database

Database:

```text
restaurant_db
```

The application uses MySQL with Spring Data JPA/Hibernate.

Database schema is managed using:

```properties
spring.jpa.hibernate.ddl-auto=update
```

## Running the Project

### 1. Requirements

Make sure the following are installed:

* Java 21
* Maven 3.9+
* MySQL
* IntelliJ IDEA or another Java IDE

### 2. Create Database

Create the MySQL database:

```sql
CREATE DATABASE restaurant_db;
```

### 3. Configure Database

Update `application.properties` with your local MySQL credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/restaurant_db
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

Do not commit real database passwords or JWT secrets to a public repository.

### 4. Build

Run:

```bash
mvn clean package
```

### 5. Run

Run the Spring Boot application from IntelliJ IDEA or use:

```bash
mvn spring-boot:run
```

The application runs on:

```text
http://localhost:8080
```

## Authentication Flow

### Register

```text
POST /api/auth/register
```

### Login

```text
POST /api/auth/login
```

After successful login, use the JWT token for protected endpoints:

```text
Authorization: Bearer <JWT_TOKEN>
```

## API Base Paths

```text
/api/auth
/api/users
/api/ingredients
/api/recipes
/api/purchases
/api/inventory
/api/tables
/api/orders
/api/payments
/api/stock-movements
/api/alerts
/api/reports
```

## Validation

The application validates incoming requests using Jakarta Bean Validation.

Examples include:

* Required fields
* Valid email format
* Positive quantities
* Non-negative prices
* Required relationships
* Valid enum values

Validation errors are handled centrally through `GlobalExceptionHandler`.

## Security

The application uses:

* Spring Security
* JWT authentication
* BCrypt password hashing
* Stateless sessions
* Method-level authorization with `@PreAuthorize`

Public endpoints include:

```text
/api/auth/**
```

All other API endpoints require authentication unless explicitly configured otherwise.

## Project Status

The core backend implementation is complete.

Completed areas include:

* Authentication & JWT
* User management
* Recipe management
* Ingredient management
* Inventory management
* Purchase management
* Stock movement and alerts
* Restaurant table management
* Order management
* Payment management
* Reporting
* Validation
* Exception handling
* Security configuration

Final Postman regression testing and documentation cleanup are planned as the final project steps.

```

