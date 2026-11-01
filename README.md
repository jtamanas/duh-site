# duh website

A one-page static site. No build step: whatever is in this folder is the site.

## What's here
- `index.html` — the page (design, copy, signup form, settings block near the bottom).
- `shows.json` — upcoming shows. **This is the only file to touch when shows change.**
- `assets/` — fonts, logo, favicon, and `share.jpg` (the picture shown when the link is shared).
- `.github/workflows/show-email-draft.yml` + `scripts/kit_draft.py` — saves a newsletter *draft* in Kit for the next show. Never sends.

## Updating shows (agent or human)
Edit `shows.json`, commit, push to `main`. The host redeploys on its own in about a minute.
- `date` is `YYYY-MM-DD`. Shows before today (New York time) hide themselves.
- The first upcoming show gets the "Next up" badge and goes in the scrolling ticker.
- `"confirmed": false` keeps a show off the site until it's real.
- `tickets` must start with `https://`.

## Newsletter (Kit)
1. The site now shows Kit's own published form (JavaScript embed, `KIT_EMBED_SRC` and `KIT_EMBED_UID` in the SETTINGS block of `index.html`, form 941860c676).
2. To use the site's own styled form instead: in Kit, open the form, choose Embed > HTML, copy its `action="..."` address and paste it as `KIT_FORM_ACTION`. That wins when set.
3. For show-announcement drafts: in GitHub, Settings > Secrets and variables > Actions, add `KIT_API_KEY` (Kit > Settings > Developer > API keys, v4). Then run "Draft show email in Kit" from the Actions tab, or have an agent trigger it. Review and send the draft in Kit.

## Contact email
The site's contact address is grace@duhsketchcomedy.com. It's `CONTACT_EMAIL` in the SETTINGS block of `index.html`; set it to '' to hide the "Email us" button and email line (the booking card then points to Instagram DMs).

The newsletter sender is john@duhsketchcomedy.com: `SENDER_EMAIL` in `.github/workflows/show-email-draft.yml`. Kit only sends from an address it has confirmed, so add it in Kit > Settings > Email (sending address) and click the confirmation email. Until then the draft action falls back to Kit's default sender. For best inbox delivery, also add Kit's domain authentication records for duhsketchcomedy.com in Cloudflare DNS.

## Domain
`index.html` (og:url, og:image) and the workflow (`SITE_URL`) use `https://duhsketchcomedy.com`, the domain the group picked. If that ever changes, update those three spots.

## Still to drop in
- Group photo for the About section (4:3) and square headshots for the cast.
