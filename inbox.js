const loginPanel = document.querySelector('[data-inbox-login]')
const loginForm = document.querySelector('[data-inbox-login-form]')
const loginStatus = document.querySelector('[data-inbox-login-status]')
const content = document.querySelector('[data-inbox-content]')
const list = document.querySelector('[data-inbox-list]')
const count = document.querySelector('[data-inbox-count]')
const refreshButton = document.querySelector('[data-inbox-refresh]')
let token = sessionStorage.getItem('shughostInboxToken') || ''

function escapeHtml(value) {
  const element = document.createElement('span')
  element.textContent = String(value || '')
  return element.innerHTML
}

function renderMessages(messages) {
  count.textContent = `${messages.length} повідомлень · ${messages.filter((item) => !item.read).length} непрочитаних`
  if (!messages.length) {
    list.innerHTML = '<div class="inbox-empty">Поки що повідомлень немає.</div>'
    return
  }
  list.innerHTML = messages.map((item) => `
    <article class="inbox-message${item.read ? '' : ' is-unread'}">
      <div class="inbox-message-head">
        <div><span class="inbox-state">${item.read ? 'Прочитано' : 'Нове'}</span><h2>${escapeHtml(item.subject)}</h2></div>
        <time datetime="${escapeHtml(item.createdAt)}">${new Date(item.createdAt).toLocaleString()}</time>
      </div>
      <p class="inbox-sender"><strong>${escapeHtml(item.name)}</strong> · <a href="mailto:${encodeURIComponent(item.replyTo)}">${escapeHtml(item.replyTo)}</a> · ${escapeHtml(item.language)}</p>
      <p class="inbox-message-body">${escapeHtml(item.message)}</p>
      <button class="button button-ghost button-small" type="button" data-message-id="${escapeHtml(item.id)}" data-next-read="${item.read ? 'false' : 'true'}">${item.read ? 'Позначити непрочитаним' : 'Позначити прочитаним'}</button>
    </article>`).join('')
}

async function loadMessages() {
  loginStatus.textContent = 'Завантаження…'
  const response = await fetch('/api/contact-admin', { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(response.status === 401 ? 'Неправильний пароль або змінну ще не додано в Railway.' : 'Не вдалося завантажити повідомлення.')
  const data = await response.json()
  loginStatus.textContent = ''
  loginPanel.hidden = true
  content.hidden = false
  renderMessages(data.messages || [])
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  token = new FormData(loginForm).get('token').trim()
  sessionStorage.setItem('shughostInboxToken', token)
  try { await loadMessages() } catch (error) { loginStatus.textContent = error.message }
})

refreshButton.addEventListener('click', () => loadMessages().catch((error) => { loginStatus.textContent = error.message }))

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-message-id]')
  if (!button) return
  button.disabled = true
  const response = await fetch('/api/contact-admin', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: button.dataset.messageId, read: button.dataset.nextRead === 'true' }),
  })
  if (response.ok) await loadMessages()
  else button.disabled = false
})

if (token) loadMessages().catch(() => sessionStorage.removeItem('shughostInboxToken'))
