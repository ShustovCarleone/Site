const loginPanel = document.querySelector('[data-inbox-login]')
const loginForm = document.querySelector('[data-inbox-login-form]')
const loginStatus = document.querySelector('[data-inbox-login-status]')
const content = document.querySelector('[data-inbox-content]')
const list = document.querySelector('[data-inbox-list]')
const count = document.querySelector('[data-inbox-count]')
const refreshButton = document.querySelector('[data-inbox-refresh]')
let token = sessionStorage.getItem('shughostInboxToken') || ''
let emailReplyConfigured = false

function escapeHtml(value) {
  const element = document.createElement('span')
  element.textContent = String(value || '')
  return element.innerHTML
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('uk-UA')
}

function renderReplyArea(item) {
  const channel = item.replyChannel || { type: 'manual', target: item.replyTo }
  if (channel.type === 'telegram') {
    return `<div class="inbox-reply-box"><p>Це Telegram-контакт. Через обмеження Telegram сайт не може першим надіслати йому повідомлення, але може відкрити профіль.</p><a class="button button-primary button-small" href="${escapeHtml(channel.target)}" target="_blank" rel="noopener noreferrer">Відповісти в Telegram ↗</a></div>`
  }
  if (channel.type !== 'email') {
    return `<div class="inbox-reply-box"><p>Контакт не схожий на email або Telegram. Скопіюй його та відповідай вручну:</p><code>${escapeHtml(channel.target)}</code></div>`
  }

  const mailtoUrl = `mailto:${channel.target}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`
  const setupNote = emailReplyConfigured ? '' : `<p class="inbox-warning">Надсилання email ще не налаштовано. Додай BREVO_API_KEY і BREVO_SENDER_EMAIL у Railway Variables.</p><a class="button button-ghost button-small" href="${escapeHtml(mailtoUrl)}">Відкрити поштову програму</a>`
  return `<form class="inbox-reply-form" data-reply-form data-message-id="${escapeHtml(item.id)}">
    <label>Відповідь для ${escapeHtml(channel.target)}<textarea name="reply" rows="6" maxlength="8000" required placeholder="Напиши відповідь…"></textarea></label>
    ${setupNote}
    <div class="inbox-reply-actions"><p class="form-status" data-reply-status aria-live="polite"></p><button class="button button-primary button-small" type="submit"${emailReplyConfigured ? '' : ' disabled'}>Надіслати email</button></div>
  </form>`
}

function renderHistory(item) {
  const replies = Array.isArray(item.replies) ? item.replies : []
  if (!replies.length) return ''
  return `<details class="inbox-reply-history"><summary>Надіслані відповіді (${replies.length})</summary>${replies.map((reply) => `<article><time>${escapeHtml(formatDate(reply.createdAt))}</time><p>${escapeHtml(reply.text)}</p></article>`).join('')}</details>`
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
        <time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(formatDate(item.createdAt))}</time>
      </div>
      <p class="inbox-sender"><strong>${escapeHtml(item.name)}</strong> · ${escapeHtml(item.replyTo)} · ${escapeHtml(item.language)}</p>
      <p class="inbox-message-body">${escapeHtml(item.message)}</p>
      <div class="inbox-message-tools"><button class="button button-ghost button-small" type="button" data-read-id="${escapeHtml(item.id)}" data-next-read="${item.read ? 'false' : 'true'}">${item.read ? 'Позначити непрочитаним' : 'Позначити прочитаним'}</button></div>
      ${renderReplyArea(item)}
      ${renderHistory(item)}
    </article>`).join('')
}

async function loadMessages() {
  loginStatus.textContent = 'Завантаження…'
  const response = await fetch('/api/contact-admin', { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(response.status === 401 ? 'Неправильний пароль або змінну ще не додано в Railway.' : 'Не вдалося завантажити повідомлення.')
  const data = await response.json()
  emailReplyConfigured = Boolean(data.emailReplyConfigured)
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
  const button = event.target.closest('[data-read-id]')
  if (!button) return
  button.disabled = true
  const response = await fetch('/api/contact-admin', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: button.dataset.readId, read: button.dataset.nextRead === 'true' }),
  })
  if (response.ok) await loadMessages()
  else button.disabled = false
})

list.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-reply-form]')
  if (!form) return
  event.preventDefault()
  const button = form.querySelector('button[type="submit"]')
  const status = form.querySelector('[data-reply-status]')
  const reply = new FormData(form).get('reply').trim()
  button.disabled = true
  status.className = 'form-status'
  status.textContent = 'Надсилання…'
  try {
    const response = await fetch('/api/contact-reply', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: form.dataset.messageId, reply }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'reply-failed')
    status.className = 'form-status is-success'
    status.textContent = 'Відповідь надіслано.'
    await loadMessages()
  } catch (error) {
    const errors = {
      'email-not-configured': 'Email ще не налаштовано в Railway.',
      'email-provider-error': 'Brevo не прийняв лист. Перевір API key та підтвердженого відправника.',
      'recipient-not-email': 'Це не email-адреса.',
    }
    status.className = 'form-status is-error'
    status.textContent = errors[error.message] || 'Не вдалося надіслати відповідь.'
    button.disabled = false
  }
})

if (token) loadMessages().catch(() => sessionStorage.removeItem('shughostInboxToken'))
