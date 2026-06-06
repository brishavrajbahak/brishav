export async function sendMailChannelsEmail(env, message) {
  const from = parseAddress(message.from);

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [
        {
          to: message.to.map(email => ({ email })),
        },
      ],
      from,
      subject: message.subject,
      reply_to: message.replyTo ? { email: message.replyTo } : undefined,
      content: [
        { type: 'text/plain', value: message.text },
        { type: 'text/html', value: message.html },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MailChannels email failed (${response.status}): ${detail}`);
  }

  return { ok: true };
}

function parseAddress(value) {
  const match = String(value).match(/^(.+?)\s*<([^>]+)>$/);
  if (!match) return { email: value };
  return { name: match[1].replace(/^"|"$/g, '').trim(), email: match[2].trim() };
}
