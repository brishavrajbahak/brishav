import { sendMailChannelsEmail } from './mailchannels.js';
import { sendResendEmail } from './resend.js';
import { renderAutoReplyHtml, renderAutoReplyText } from './templates/autoReply.js';
import { renderNotificationHtml, renderNotificationText } from './templates/notification.js';

export async function sendNotification(env, payload, meta) {
  assertEnv(env, ['CONTACT_TO_EMAIL', 'CONTACT_FROM_EMAIL']);

  return sendEmail(env, {
    from: env.CONTACT_FROM_EMAIL,
    to: [env.CONTACT_TO_EMAIL],
    replyTo: payload.email,
    subject: `Portfolio contact: ${payload.subject || 'New message'}`,
    text: renderNotificationText(payload, meta),
    html: renderNotificationHtml(payload, meta),
  });
}

export async function sendAutoReply(env, payload) {
  const from = env.AUTO_REPLY_FROM_EMAIL || env.CONTACT_FROM_EMAIL;
  if (!from) throw new Error('Missing AUTO_REPLY_FROM_EMAIL or CONTACT_FROM_EMAIL');

  return sendEmail(env, {
    from,
    to: [payload.email],
    replyTo: env.CONTACT_TO_EMAIL || from,
    subject: env.AUTO_REPLY_SUBJECT || 'Thanks for reaching out',
    text: renderAutoReplyText(payload),
    html: renderAutoReplyHtml(payload),
  });
}

async function sendEmail(env, message) {
  const provider = (env.EMAIL_PROVIDER || 'resend').toLowerCase();
  if (provider === 'mailchannels') return sendMailChannelsEmail(env, message);
  return sendResendEmail(env, message);
}

function assertEnv(env, names) {
  const missing = names.filter(name => !env[name]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}
