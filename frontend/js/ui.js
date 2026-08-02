/**
 * Frontend UI Utility Manager (Toasts, Modals, Theme Switcher)
 */

class UIManager {
  constructor() {
    this.initTheme();
  }

  /**
   * Theme Switcher
   */
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.showToast(`Switched to ${newTheme} mode`, 'info');
  }

  /**
   * Show Toast Notification
   * @param {string} message 
   * @param {string} type - 'success', 'danger', 'warning', 'info'
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let borderColor = '#3b82f6';
    if (type === 'success') borderColor = '#10b981';
    if (type === 'danger') borderColor = '#ef4444';
    if (type === 'warning') borderColor = '#f59e0b';

    toast.style.borderLeft = `4px solid ${borderColor}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; cursor:pointer; font-size:16px;">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  }

  /**
   * Modal Dialog Handler
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }
}

const UI = new UIManager();
