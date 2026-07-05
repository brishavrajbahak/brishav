## Merge Checklist

- [ ] I ran `npm ci`
- [ ] I ran `npm run lint`
- [ ] I ran `npm run build`
- [ ] I verified the Cloudflare Pages preview
- [ ] I verified mobile Demo Mode
- [ ] I verified Pages Functions
- [ ] I verified analytics events
- [ ] I verified contact / Turnstile on an allowed hostname
- [ ] I rebuilt and committed the generated bundles
- [ ] I did not stage or commit planning/spec markdown from the prep process

## Summary

- 

## V1 Success Metrics Achieved

- Terminal usage:
- Mandala interaction rate:
- Time on site:
- Mobile Lighthouse:

## Known Limitations in V1

- The playground is still a curated demo, not an upload workflow.
- This branch does not add uploads.
- This branch does not add R2, D1, Workers AI, or PDF export.

## Validation Notes

- If the preview hostname is not allowed by Turnstile, use `brishavrajbahak.com.np` for the contact-form test and note it here.
- Verify analytics events in the preview network tab or Cloudflare logs:
  - `terminal_command`
  - `mandala_view`
  - `playground_open`
  - `analyze_run`
