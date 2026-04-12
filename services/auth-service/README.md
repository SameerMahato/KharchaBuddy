# Auth Service

Authentication and user management microservice for KharchaBuddy AI Financial Operating System.

## Features

- User registration with email and phone
- JWT-based authentication (access + refresh tokens)
- Password hashing with bcrypt
- User profile management
- Password reset flow
- Rate limiting for auth endpoints
- Prometheus metrics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `DELETE /api/users/profile` - Delete user account (requires auth)

### Health & Metrics
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## Environment Variables

See `.env.example` for required environment variables.

## Architecture

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: bcrypt (cost factor 12)
- **Validation**: Zod schemas
- **Logging**: Winston
- **Metrics**: Prometheus

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with short expiration (15 minutes)
- Refresh tokens for long-lived sessions
- Rate limiting on auth endpoints (5 requests per 15 minutes)
- Input validation with Zod
- Helmet for security headers
- CORS enabled
