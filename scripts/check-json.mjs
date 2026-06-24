import { readFileSync } from 'node:fs';

const schema = JSON.parse(readFileSync('shared/contact-api.v1.schema.json', 'utf8'));

if (schema.properties?.version?.const !== 1) {
  throw new Error('Contact schema version must remain const 1.');
}

const payload = schema.properties?.payload;
if (!payload || payload.type !== 'object') {
  throw new Error('Contact schema payload must remain an object.');
}

for (const field of ['name', 'email', 'message', 'website']) {
  if (!payload.required?.includes(field)) {
    throw new Error(`Contact schema payload must require "${field}".`);
  }
}

if (payload.properties?.subject?.maxLength !== 160) {
  throw new Error('Contact schema subject maxLength must remain 160.');
}

console.log('JSON/schema checks passed.');
