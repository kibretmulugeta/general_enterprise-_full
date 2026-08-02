# 🚀 Enterprise Authentication Framework Production Deployment Guide

This guide provides step-by-step instructions to deploy the **Enterprise Authentication Framework** across cloud providers: **Render**, **Vercel**, **Docker / Cloud Containers**, and **Self-Hosted Linux VPS (Nginx + PM2)**.

---

## 🗄️ Step 1: Set Up Production MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a new Cluster (e.g., M0 Free Tier or M10 Dedicated).
3. Under **Database Access**, create a database user (e.g. `db_admin`) with a strong password.
4. Under **Network Access**, add `0.0.0.0/0` (or your cloud server's static IP address) to the IP Access List.
5. Click **Connect** $\rightarrow$ **Drivers** and copy your connection URI string:
   ```text
   mongodb+srv://db_admin:<PASSWORD>@cluster0.mongodb.net/enterprise_auth?retryWrites=true&w=majority
   ```

---

## 🔑 Step 2: Set Up Production Google & GitHub OAuth Credentials

### A. Google OAuth 2.0
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** $\rightarrow$ **Credentials**.
3. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
4. Add Authorized redirect URIs:
   ```text
   https://<YOUR-DOMAIN-OR-RENDER-APP>.onrender.com/api/v1/auth/google/callback
   ```
5. Copy your **Client ID** and **Client Secret**.

### B. GitHub OAuth
1. Go to GitHub **Settings** $\rightarrow$ **Developer Settings** $\rightarrow$ **OAuth Apps**.
2. Click **New OAuth App**.
3. Set Authorization callback URL:
   ```text
   https://<YOUR-DOMAIN-OR-RENDER-APP>.onrender.com/api/v1/auth/github/callback
   ```
4. Copy your **Client ID** and generate a **Client Secret**.

---

## ☁️ Step 3: Deployment Options

### Option A: Render Deployment (Recommended)

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render](https://render.com/).
3. Click **New +** $\rightarrow$ **Blueprint** (or **Web Service**).
4. Connect your GitHub repository. Render will automatically detect the [render.yaml](file:///e:/Developer/FULL_STACK/general_enterprise%20_full/render.yaml) file.
5. Add the required Environment Variables in the Render Dashboard:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `APP_URL`: `https://your-app.onrender.com`
   - `FRONTEND_URL`: `https://your-app.onrender.com`
   - `GOOGLE_CLIENT_ID`: `<Your Google Client ID>`
   - `GOOGLE_CLIENT_SECRET`: `<Your Google Client Secret>`
   - `GITHUB_CLIENT_ID`: `<Your GitHub Client ID>`
   - `GITHUB_CLIENT_SECRET`: `<Your GitHub Client Secret>`
   - `COOKIE_SECURE`: `true`
6. Click **Deploy Web Service**. Render will automatically run the database seeder on initial startup.

---

### Option B: Vercel Deployment

1. Install Vercel CLI or connect via the Vercel Web Portal:
   ```bash
   npm i -g vercel
   vercel login
   ```
2. Run deployment from the root directory:
   ```bash
   vercel
   ```
3. In your Vercel Project Settings $\rightarrow$ **Environment Variables**, add:
   - `MONGODB_URI`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `COOKIE_SECRET`
   - `COOKIE_SECURE` (`true`)

---

### Option C: Docker Container Deployment

1. Build the production Docker image using [backend/Dockerfile](file:///e:/Developer/FULL_STACK/general_enterprise%20_full/backend/Dockerfile):
   ```bash
   cd backend
   docker build -t enterprise-auth:latest .
   ```
2. Run the container locally or on your cloud container service (AWS ECS, DigitalOcean App Platform, Railway):
   ```bash
   docker run -d \
     -p 5000:5000 \
     --env-file .env \
     --name enterprise-auth-container \
     enterprise-auth:latest
   ```

---

### Option D: Self-Hosted Linux VPS (Ubuntu / Debian + Nginx + PM2)

1. **SSH into your VPS server**:
   ```bash
   ssh root@<YOUR_SERVER_IP>
   ```
2. **Install Node.js, Git, PM2, and Nginx**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs git nginx
   sudo npm install -g pm2
   ```
3. **Clone your repository & install backend packages**:
   ```bash
   git clone <YOUR_GIT_REPO_URL> /var/www/enterprise-auth
   cd /var/www/enterprise-auth/backend
   npm install --production
   ```
4. **Create `.env` file**:
   ```bash
   nano .env
   ```
   Add your MongoDB Atlas URI, secrets, and OAuth credentials.

5. **Start PM2 Process**:
   ```bash
   pm2 start server.js --name "enterprise-auth"
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx Reverse Proxy & SSL**:
   Create Nginx configuration `/etc/nginx/sites-available/enterprise-auth`:
   ```nginx
   server {
       server_name auth.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
7. **Enable Site & Enable Free Let's Encrypt SSL**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/enterprise-auth /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d auth.yourdomain.com
   ```

---

## ✅ Post-Deployment Verification Checklist

- [ ] Connect to `https://<YOUR-DOMAIN>/api/health` and ensure response returns `{"status":"UP"}`.
- [ ] Sign in with the seeded Super Admin user (`admin@enterprise.local` / `Admin@123456!`).
- [ ] Immediately change the default Super Admin password from the Profile page.
- [ ] Test 2FA setup using an authenticator app (Google Authenticator / Authy).
- [ ] Test active session revocation from another browser window or mobile device.
