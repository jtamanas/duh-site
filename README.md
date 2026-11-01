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
1. In Kit, create a form, choose Embed > HTML, and copy its `action="..."` address.
2. Paste it as `KIT_FORM_ACTION` in the SETTINGS block of `index.html`.
3. For show-announcement drafts: in GitHub, Settings > Secrets and variables > Actions, add `KIT_API_KEY` (Kit > Settings > Developer > API keys, v4). Then run "Draft show email in Kit" from the Actions tab, or have an agent trigger it. Review and send the draft in Kit.

## Domain
`index.html` (og:url, og:image) and the workflow (`SITE_URL`) use `https://duhsketchcomedy.com`, the domain the group picked. If that ever changes, update those three spots.

## Still to drop in
- Group photo for the About section (4:3) and square headshots for the cast.
