/**
 * API Fetch Wrapper with automatic Cookie Handling and Refresh Token Retry
 */

const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // If sending FormData (e.g. file upload), let browser handle Content-Type header
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const config = {
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers },
      credentials: 'include', // Send and receive HttpOnly cookies
      ...options
    };

    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      let response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);

      // Handle 401 Unauthorized - Attempt Automatic Refresh Token Rotation
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshSuccess = await this.refreshToken();
        if (refreshSuccess) {
          // Retry original request
          response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
        } else {
          // Refresh failed - Redirect to login
          Auth.handleUnauthenticated();
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'An error occurred while processing your request.');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async refreshToken() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });
      return response.ok;
    } catch (err) {
      return false;
    }
  }
};
