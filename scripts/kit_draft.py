"""Create a Kit broadcast DRAFT announcing the next confirmed show in shows.json.

Runs in GitHub Actions (see .github/workflows/show-email-draft.yml). It never
sends: it saves a draft in Kit (send_at = null) that a person reviews and sends.
Needs the repository secret KIT_API_KEY (a Kit v4 API key).
"""
import datetime, html, json, os, sys, urllib.request
from zoneinfo import ZoneInfo

SITE = os.environ.get("SITE_URL", "").rstrip("/")
key = os.environ.get("KIT_API_KEY")
if not key:
    sys.exit("KIT_API_KEY secret is not set; nothing to do.")

today = datetime.datetime.now(ZoneInfo("America/New_York")).date().isoformat()
shows = [s for s in json.load(open("shows.json"))["shows"]
         if s.get("confirmed", True) and s.get("date", "") >= today]
shows.sort(key=lambda s: s["date"])
want = os.environ.get("SHOW_DATE", "").strip()
if want:
    shows = [s for s in shows if s["date"] == want]
if not shows:
    sys.exit("No upcoming confirmed show to announce.")
s = shows[0]
day = datetime.date.fromisoformat(s["date"])
when = day.strftime("%A, %B ") + str(day.day)
e = html.escape
where = " · ".join(x for x in [s.get("venue"), s.get("address")] if x)
tickets = s.get("tickets", "")
subject = f"duh is back {day.strftime('%a %b')} {day.day}"
body = f"""<p><strong>{e(s.get('title', 'duh live'))}</strong></p>
<p>{e(when)}{(' at ' + e(s['time'])) if s.get('time') else ''}<br>{e(where)}<br>{e(s.get('details', ''))}</p>
{('<p>' + e(s['blurb']) + '</p>') if s.get('blurb') else ''}
{('<p><a href="' + e(tickets) + '">Get tickets</a></p>') if tickets.startswith('https://') else ''}
<p>See you there,<br>duh</p>
{('<p><a href="' + e(SITE) + '">' + e(SITE.replace('https://', '')) + '</a></p>') if SITE else ''}"""

payload = {
    "subject": subject,
    "content": body,
    "description": f"Show announcement {s['date']} (draft from shows.json)",
    "preview_text": f"{when}{(' at ' + s['venue']) if s.get('venue') else ''}",
    "public": False,
    "published_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "send_at": None,  # null = draft; Kit defaults the audience to all subscribers
}

req = urllib.request.Request("https://api.kit.com/v4/broadcasts",
                             data=json.dumps(payload).encode(),
                             headers={"X-Kit-Api-Key": key, "Content-Type": "application/json",
                                      "Accept": "application/json"}, method="POST")
with urllib.request.urlopen(req) as r:
    out = json.load(r)
print("Draft created in Kit:", out.get("broadcast", {}).get("id"), "-", subject)
