import { escapeHtml } from './utils.js';

export function renderAutoReplyText(payload) {
  return [
    `Hi ${payload.name},`,
    '',
    "Thank you for contacting me through my portfolio website. I've received your message and will review it shortly. You can expect a personal reply within 24 hours.",
    '',
    'Best regards,',
    'Brishav Rajbahak',
    'Portfolio: https://brishavrajbahak.com.np',
    'For direct replies: contact@brishavrajbahak.com.np',
  ].join('\n');
}

export function renderAutoReplyHtml(payload) {
  return `
    <p>Hi ${escapeHtml(payload.name)},</p>
    <p>Thank you for contacting me through my portfolio website. I've received your message and will review it shortly. You can expect a personal reply within 24 hours.</p>
    <p>
      Best regards,<br>
      Brishav Rajbahak<br>
      Portfolio: <a href="https://brishavrajbahak.com.np">brishavrajbahak.com.np</a><br>
      For direct replies: <a href="mailto:contact@brishavrajbahak.com.np">contact@brishavrajbahak.com.np</a>
    </p>
  `;
}
