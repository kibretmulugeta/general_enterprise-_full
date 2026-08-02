/**
 * Frontend Authentication State & Route Guard Manager
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
  }

  /**
   * Fetch current authenticated user
   */
  async checkAuth() {
    try {
      const res = await API.request('/auth/me');
      if (res.success) {
        this.currentUser = res.data.user;
        this.renderNavbar();
        return this.currentUser;
      }
    } catch (err) {
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Require Authentication Route Guard
   */
  async requireAuth() {
    const user = await this.checkAuth();
    if (!user) {
      window.location.href = '/pages/login.html';
    }
    return user;
  }

  /**
   * Require Guest (redirect away from login if already logged in)
   */
  async requireGuest() {
    const user = await this.checkAuth();
    if (user) {
      window.location.href = '/pages/dashboard.html';
    }
  }

  /**
   * Require Admin Role Guard
   */
  async requireAdmin() {
    const user = await this.requireAuth();
    if (!['Super Admin', 'Admin'].includes(user.role)) {
      UI.showToast('Access Denied: Admin privileges required.', 'danger');
      setTimeout(() => {
        window.location.href = '/pages/dashboard.html';
      }, 1500);
    }
  }

  /**
   * Logout User
   */
  async logout() {
    try {
      await API.request('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      this.currentUser = null;
      window.location.href = '/pages/login.html';
    }
  }

  /**
   * Dynamically Render Navigation Header
   */
  renderNavbar() {
    const navRight = document.getElementById('nav-right');
    if (!navRight) return;

    if (this.currentUser) {
      const isAdmin = ['Super Admin', 'Admin'].includes(this.currentUser.role);
      navRight.innerHTML = `
        <ul class="nav-links">
          <li><a href="/pages/dashboard.html" class="nav-link">Dashboard</a></li>
          <li><a href="/pages/profile.html" class="nav-link">Profile</a></li>
          <li><a href="/pages/security.html" class="nav-link">Security</a></li>
          <li><a href="/pages/sessions.html" class="nav-link">Sessions</a></li>
          <li><a href="/pages/audit-logs.html" class="nav-link">Audit Logs</a></li>
          ${isAdmin ? '<li><a href="/pages/admin.html" class="nav-link" style="color:var(--warning)">Admin Portal</a></li>' : ''}
          <li>
            <button onclick="UI.toggleTheme()" class="theme-toggle" title="Toggle Light/Dark Theme">
              <span id="theme-icon">🌙</span>
            </button>
          </li>
          <li>
            <button onclick="Auth.logout()" class="btn btn-secondary" style="padding:0.4rem 1rem;">Logout</button>
          </li>
        </ul>
      `;
    } else {
      navRight.innerHTML = `
        <ul class="nav-links">
          <li><a href="/pages/login.html" class="nav-link">Sign In</a></li>
          <li><a href="/pages/register.html" class="btn btn-primary">Get Started</a></li>
          <li>
            <button onclick="UI.toggleTheme()" class="theme-toggle" title="Toggle Light/Dark Theme">
              <span id="theme-icon">🌙</span>
            </button>
          </li>
        </ul>
      `;
    }
  }

  handleUnauthenticated() {
    if (!window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/register.html') && window.location.pathname !== '/') {
      window.location.href = '/pages/login.html';
    }
  }
}

const Auth = new AuthManager();
