# User Management Microservice

A secure, serverless user management system built with AWS Lambda, MongoDB, and Node.js. This microservice provides authentication, user profile management, and a secure 6-word recovery system for password resets.

## Features

- **User Authentication**
  - Secure signup and login
  - JWT-based authentication
  - Account lockout protection after failed login attempts

- **6-Word Recovery System**
  - Generate unique 6-word combinations for account recovery
  - Securely hash and store recovery phrases
  - Verify recovery words to enable password resets

- **User Profile Management**
  - Create, read, update, and delete user profiles
  - Manage notification preferences
  - Update personal information

- **Security Features**
  - Password hashing with bcrypt
  - Protected routes with JWT verification
  - Secure password reset mechanism

## Architecture

This microservice is designed using a serverless architecture:

- **AWS Lambda**: Handles all API requests
- **API Gateway**: Manages API routing and authorization
- **MongoDB**: Stores user data and credentials
- **Serverless Framework**: Simplifies deployment and configuration

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Create a new user account and receive 6 recovery words |
| `/auth/login` | POST | Authenticate user and receive JWT |
| `/auth/verify-recovery-words` | POST | Verify recovery words to enable password reset |
| `/auth/reset-password` | POST | Reset password using token from recovery verification |

### User Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/users` | GET | Get all users (admin only) |
| `/users` | POST | Create a new user |
| `/users/profile` | GET | Get current user's profile |
| `/users/profile` | PUT | Update current user's profile |
| `/users/{id}` | GET | Get user by ID |
| `/users/{id}` | PUT | Update user by ID |
| `/users/{id}` | DELETE | Delete user by ID |