import { escapeHtml } from './utils.js';

export function renderAutoReplyText(payload) {
  return [
    `Hi ${payload.name},`,
    '',
    'Thanks for reaching out. I received your message and will reply as soon as I can.',
    '',
    'Your message:',
    payload.message,
    '',
    'Brishav Rajbahak',
  ].join('\n');
}

export function renderAutoReplyHtml(payload) {
  return `
    <p>Hi ${escapeHtml(payload.name)},</p>
    <p>Thanks for reaching out. I received your message and will reply as soon as I can.</p>
    <p><strong>Your message:</strong></p>
    <blockquote>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</blockquote>
    <p>Brishav Rajbahak</p>
  `;
}
