import type { Item } from './types'
import {
  initClient,
  clearClient,
  testConnection,
  fetchItems,
  insertItem,
  removeItem,
} from './supabase'
import {
  getElement,
  escapeHtml,
  showToast,
  updateConnectionStatus,
  showConfigSection,
  showAppSection,
} from './ui'

async function loadItems(): Promise<void> {
  const container = getElement<HTMLDivElement>('itemsContainer')
  container.innerHTML = '<p class="loading">Loading...</p>'

  try {
    const items = await fetchItems()

    if (items.length === 0) {
      container.innerHTML = '<p class="empty-message">No items yet. Add one above!</p>'
      return
    }

    container.innerHTML = items
      .map(
        (item: Item) => `
      <div class="item" data-id="${item.id}">
        <div class="item-info">
          <h3>${escapeHtml(item.name)}</h3>
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
        </div>
        <div class="item-actions">
          <button class="btn-small btn-danger" data-delete-id="${item.id}">Delete</button>
        </div>
      </div>
    `
      )
      .join('')

    // Attach delete handlers
    container.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).dataset.deleteId
        if (id) await deleteItem(id)
      })
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    container.innerHTML = `<p class="error-message">Error: ${message}</p>`
  }
}

async function initSupabase(url: string, key: string): Promise<void> {
  try {
    initClient(url, key)
    const result = await testConnection()

    if (!result.success) {
      showToast(result.error ?? 'Connection failed', 'error')
      updateConnectionStatus(false)
      return
    }

    showAppSection()
    updateConnectionStatus(true)
    await loadItems()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    showToast('Connection failed: ' + message, 'error')
    updateConnectionStatus(false)
  }
}

function saveConfig(): void {
  const url = getElement<HTMLInputElement>('supabaseUrl').value.trim()
  const key = getElement<HTMLInputElement>('supabaseKey').value.trim()

  if (!url || !key) {
    showToast('Please enter both URL and Key', 'error')
    return
  }

  localStorage.setItem('supabase_url', url)
  localStorage.setItem('supabase_key', key)

  initSupabase(url, key)
}

function clearConfig(): void {
  localStorage.removeItem('supabase_url')
  localStorage.removeItem('supabase_key')
  clearClient()

  showConfigSection()
  getElement<HTMLInputElement>('supabaseUrl').value = ''
  getElement<HTMLInputElement>('supabaseKey').value = ''

  showToast('Configuration cleared')
}

async function addItem(): Promise<void> {
  const nameInput = getElement<HTMLInputElement>('itemName')
  const descInput = getElement<HTMLInputElement>('itemDescription')

  const name = nameInput.value.trim()
  const description = descInput.value.trim()

  if (!name) {
    showToast('Please enter an item name', 'error')
    return
  }

  try {
    await insertItem(name, description || null)
    nameInput.value = ''
    descInput.value = ''
    showToast('Item added!', 'success')
    await loadItems()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    showToast('Error: ' + message, 'error')
  }
}

async function deleteItem(id: string): Promise<void> {
  try {
    await removeItem(id)
    showToast('Item deleted', 'success')
    await loadItems()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    showToast('Error: ' + message, 'error')
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const savedUrl = localStorage.getItem('supabase_url')
  const savedKey = localStorage.getItem('supabase_key')

  if (savedUrl && savedKey) {
    getElement<HTMLInputElement>('supabaseUrl').value = savedUrl
    getElement<HTMLInputElement>('supabaseKey').value = savedKey
    initSupabase(savedUrl, savedKey)
  }

  // Attach event listeners
  getElement('saveConfigBtn').addEventListener('click', saveConfig)
  getElement('clearConfigBtn').addEventListener('click', clearConfig)
  getElement('addItemBtn').addEventListener('click', addItem)
})
