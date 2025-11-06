# CodeHive 🐝

[![Backend Tests](https://github.com/IrminDev/CodeHive/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/IrminDev/CodeHive/actions/workflows/backend-tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java](https://img.shields.io/badge/Java-25-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.6-brightgreen.svg)](https://spring.io/projects/spring-boot)

> A collaborative platform for educational purposes that allows teachers to create groups with their students, and students can deliver code by editing it from the same platform.

## 🚀 Features

- 🔐 **Secure Authentication** - JWT-based authentication with password recovery
- 👥 **User Management** - Role-based access control (Students, Teachers, Admins)
- 🛡️ **Rate Limiting** - Protection against bot attacks and brute force
- 📧 **Email Integration** - Password reset and notifications
- 📝 **API Documentation** - Interactive Swagger/OpenAPI documentation
- ✅ **Comprehensive Testing** - 121 tests with 70%+ code coverage
- 🔄 **CI/CD** - Automated testing and deployment pipelines

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Contributing](#contributing)

## 🏁 Getting Started

### Prerequisites

- **Java 25** or later
- **PostgreSQL 15+** (for production)
- **Node.js 18+** (for frontend)
- **Gradle** (included via wrapper)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/IrminDev/CodeHive.git
   cd CodeHive/codehive-backend
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the application**
   ```bash
   ./gradlew bootRun
   ```

4. **Access the application**
   - API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html

### Frontend Setup

```bash
cd codehive-frontend
npm install
npm run dev
```

Access at: http://localhost:3000

## 🏗️ Architecture

### Backend Stack

- **Framework**: Spring Boot 3.5.6
- **Language**: Java 25
- **Database**: PostgreSQL (production), H2 (testing)
- **Security**: Spring Security + JWT
- **Rate Limiting**: Bucket4j
- **Email**: JavaMailSender
- **Testing**: JUnit 5, Mockito, AssertJ
- **Documentation**: SpringDoc OpenAPI

### Project Structure

```
codehive-backend/
├── src/main/java/com/github/codehive/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── model/           # Entities, DTOs, requests, responses
│   ├── repository/      # JPA repositories
│   ├── service/         # Business logic
│   ├── security/        # Security configuration
│   ├── ratelimit/       # Rate limiting
│   └── utils/           # Utility classes
└── src/test/java/       # Tests (unit & integration)
```

## ✅ Testing

### Running Tests

```bash
# All tests
./gradlew test

# Unit tests only
./gradlew test --tests "*Test" --exclude-tests "*IntegrationTest"

# Integration tests only
./gradlew test --tests "*IntegrationTest"

# With coverage report
./gradlew test jacocoTestReport
```

### Test Coverage

- **121 total tests**
  - 71 unit tests
  - 50 integration tests
- **70%+ code coverage**
- **Test pyramid followed**: 70% unit, 30% integration

### Coverage Report

View the detailed coverage report:
```bash
open build/reports/jacoco/test/html/index.html
```

## 📚 API Documentation

### Interactive Documentation

Access Swagger UI at: http://localhost:8080/swagger-ui.html

### Main Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

#### Password Recovery
- `POST /api/recovery-password/forgot` - Request password reset
- `POST /api/recovery-password/reset` - Reset password with token

### Rate Limits

| Endpoint | Limit | Duration |
|----------|-------|----------|
| Login | 5 requests | 60 seconds |
| Signup | 3 requests | 5 minutes |
| Forgot Password | 3 requests | 5 minutes |
| Reset Password | 5 requests | 5 minutes |

## 🛠️ Development

### Code Style

- Follow Java naming conventions
- Use meaningful variable/method names
- Add JavaDoc for public APIs
- Keep methods focused and small

### Git Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and commit: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/my-feature`
4. Create a Pull Request

### CI/CD Pipeline

Every push and PR triggers:
- ✅ Automated testing (unit & integration)
- 📊 Code coverage analysis
- 🏗️ Application build
- 📝 Test results published to PR

See [.github/workflows/README.md](.github/workflows/README.md) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create your feature branch
3. Write tests for your changes
4. Ensure all tests pass: `./gradlew test`
5. Commit your changes
6. Push to your fork
7. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Irmin** - *Initial work* - [IrminDev](https://github.com/IrminDev)

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- All contributors who have helped this project

## 📞 Support

- 📧 Email: irmin@codehive.com
- 🐛 Issues: [GitHub Issues](https://github.com/IrminDev/CodeHive/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/IrminDev/CodeHive/discussions)

---

Made with ❤️ for education
