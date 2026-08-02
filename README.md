# 🛡️ Enterprise Full-Stack Authentication Framework

An enterprise-grade, self-hosted Authentication and Identity Management Platform built with **Node.js, Express.js, MongoDB, Passport.js, JWT HttpOnly Cookies, RBAC/PBAC, 2FA (TOTP), Session Management, Audit Logging, and a Glassmorphism Frontend**.

Designed for enterprise applications such as:
- Hotel Management Systems
- Hospital & Medical Imaging Platforms
- ERP & CRM Platforms
- SaaS Applications & Admin Dashboards

---

## 🌟 Key Features

- **🔐 Robust JWT & Refresh Token Rotation**: Secure HttpOnly, SameSite cookies with access token expiration and refresh token rotation stored in MongoDB to prevent replay attacks.
- **🌐 Social OAuth 2.0 Integration**: Pre-configured Google OAuth 2.0 and GitHub OAuth strategy integration with automatic profile linking.
- **🛡️ Dynamic RBAC & PBAC Authorization Engine**:
  - Roles: `Super Admin`, `Admin`, `Manager`, `Employee`, `User`, `Guest`.
  - Fine-grained granular permissions (`user.create`, `booking.cancel`, `invoice.view`, etc.) with per-user override capabilities.
- **📱 Multi-Factor Authentication (2FA)**: Speakeasy TOTP authenticator integration with QR code generation and emergency backup recovery codes.
- **💻 Active Session Management**: Track operating system, browser, IP address, device type, and last active timestamp. Revoke single or all active sessions.
- **📜 Comprehensive Security Audit Logging**: Automatic audit tracking for sign-in attempts, password changes, MFA updates, role assignments, and security events.
- **🔒 Brute Force Protection & Account Locking**: Automatic account lockout after configurable consecutive failed login attempts.
- **🎨 Glassmorphism Responsive UI**: Modern dark/light theme toggle, toast notification system, route guards, modal dialogs, and admin analytics dashboard.

---

## 🏗️ Architecture & Folder Structure

Built using **Clean Architecture** and **MVC / Repository Pattern**:

```
project-root/
├── backend/
│   ├── config/              # Database, Passport & Constants configuration
│   ├── controllers/         # HTTP Request handlers
│   ├── middleware/          # JWT Protect, RBAC, PBAC, Rate Limiters, Error Handler
│   ├── models/              # Mongoose database schemas (User, Session, AuditLog, etc.)
│   ├── repositories/        # Data Access Layer
│   ├── services/            # Core business logic (Auth, OAuth, Session, Audit, Admin)
│   ├── validators/          # Express-validator input schemas
│   ├── utils/               # JWT, Bcrypt, TOTP, Logger, Device Parser, Seeder
│   ├── emails/              # Nodemailer HTML templates
│   ├── tests/               # Automated Jest & Supertest integration test suite
│   ├── app.js               # Express application configuration
│   ├── server.js            # Entry point & DB seeder execution
│   └── package.json
├── frontend/
│   ├── css/                 # Glassmorphism design tokens & styles
│   ├── js/                  # API Client, Auth State Manager, UI Toasts & Modals
│   ├── pages/               # Login, Register, Dashboard, Profile, Security, Sessions, Audit, Admin
│   └── index.html           # Landing page showcase
└── README.md
```

---

## 🗄️ Database Collections

The MongoDB database includes 14 professional collections:
- `users`: Core profile metadata, role, status, 2FA secret, failed attempt counts.
- `roles`: Role definitions and system flags.
- `permissions`: System-wide granular permission codes.
- `role_permissions`: Mapping of roles to permission codes.
- `user_permissions`: Per-user granular permission overrides.
- `oauth_accounts`: Linked social login accounts.
- `sessions`: Active device session metadata and TTL indexes.
- `refresh_tokens`: Refresh token hashes and revocation states.
- `password_reset_tokens`: Crypto hashed single-use password reset tokens.
- `email_verification_tokens`: Email confirmation tokens.
- `audit_logs`: Traceability logs of all security actions.
- `devices`: Fingerprinted trusted user devices.
- `notifications`: User security alerts.
- `api_keys`: Machine-to-machine integration API keys.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas URI)

### 2. Environment Configuration
Copy the `.env.example` file in `backend/` and update environment variables:
```bash
cp backend/.env.example backend/.env
```

Key environment variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/enterprise_auth
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
COOKIE_SECRET=your_cookie_secret_key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. Install Dependencies & Run
```bash
cd backend
npm install
npm run dev
```

The application will automatically connect to MongoDB, run the database seeder to create default roles and permissions, and create the default **Super Admin** account:
- **Email:** `admin@enterprise.local`
- **Password:** `Admin@123456!`

Open browser at `http://localhost:5000`.

---

## 🧪 Running Automated Tests

Run the backend test suite via Jest and Supertest:
```bash
cd backend
npm test
```

---

## 🛰️ API Documentation Matrix

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new local email user |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & issue HttpOnly JWT cookies |
| `POST` | `/api/v1/auth/logout` | Protected | Revoke active session & clear cookies |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token & return new access token |
| `GET` | `/api/v1/auth/me` | Protected | Fetch current authenticated user profile |
| `GET` | `/api/v1/auth/google` | Public | Trigger Google OAuth 2.0 flow |
| `GET` | `/api/v1/auth/github` | Public | Trigger GitHub OAuth flow |
| `PUT` | `/api/v1/profile` | Protected | Update profile details (Name, Display Name) |
| `POST` | `/api/v1/profile/avatar` | Protected | Upload profile photo (Multer) |
| `POST` | `/api/v1/profile/change-password` | Protected | Change account password |
| `GET` | `/api/v1/profile/mfa/setup` | Protected | Generate 2FA TOTP secret & QR code |
| `POST` | `/api/v1/profile/mfa/enable` | Protected | Validate TOTP token & activate 2FA |
| `GET` | `/api/v1/sessions` | Protected | List all active sessions & device details |
| `DELETE`| `/api/v1/sessions/:id` | Protected | Revoke single active session |
| `DELETE`| `/api/v1/sessions` | Protected | Revoke all other active sessions |
| `GET` | `/api/v1/audit-logs` | Protected | Query security audit events |
| `GET` | `/api/v1/admin/users` | Admin | List all platform users with search/filter |
| `PUT` | `/api/v1/admin/users/:id/role` | Admin | Update user system role (RBAC) |
| `GET` | `/api/v1/admin/analytics` | Admin | Get platform authentication analytics |

---

## 🌐 Deployment Instructions

### Render / Heroku
1. Push code to your Git repository.
2. Create a new **Web Service** on Render and select your repository.
3. Set Build Command: `cd backend && npm install`
4. Set Start Command: `cd backend && node server.js`
5. Add Environment Variables from `.env.example` (ensure `MONGODB_URI` points to MongoDB Atlas).

### Vercel
1. Deploy frontend directory or configure `serverless.json` for Express backend routes.

---

## 📜 License
MIT License - Built for Enterprise Scale Applications.
