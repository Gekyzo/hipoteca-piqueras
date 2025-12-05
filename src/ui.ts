import type { ToastType } from './types';

export function getElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Element #${id} not found`);
  }
  return el as T;
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function showToast(message: string, type: ToastType = 'info'): void {
  const existing = document.querySelector('.toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

export function updateConnectionStatus(connected: boolean): void {
  const status = getElement<HTMLSpanElement>('connectionStatus');
  status.textContent = connected ? 'Connected' : 'Disconnected';
  status.className = connected ? 'connected' : 'disconnected';
}

export function showConfigSection(): void {
  getElement('configSection').style.display = 'block';
  getElement('appSection').style.display = 'none';
}

export function showAppSection(): void {
  getElement('configSection').style.display = 'none';
  getElement('appSection').style.display = 'block';
}
