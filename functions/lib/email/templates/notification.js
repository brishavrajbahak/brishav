import { escapeHtml } from './utils.js';

export function renderNotificationText(payload, meta) {
  return [
    'New portfolio contact message',
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Subject: ${payload.subject || '(No subject)'}`,
    `Submitted: ${meta.submittedAt}`,
    `IP: ${meta.ip}`,
    `User agent: ${meta.userAgent}`,
    '',
    payload.message,
  ].join('\n');
}

export function renderNotificationHtml(payload, meta) {
  return `
    <h2>New portfolio contact message</h2>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(payload.subject || '(No subject)')}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(meta.submittedAt)}</p>
    <p><strong>IP:</strong> ${escapeHtml(meta.ip)}</p>
    <p><strong>User agent:</strong> ${escapeHtml(meta.userAgent)}</p>
    <hr>
    <p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
  `;
}
