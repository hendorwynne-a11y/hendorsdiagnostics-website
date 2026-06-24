// Vercel serverless function: /api/teamup
// Proxies requests to the TeamUp API to avoid CORS issues in the browser.
// The TeamUp API key is stored server-side in Vercel environment variables,
// but can also be passed from the client for flexibility (stored in localStorage).
//
// Usage: POST /api/teamup
// Body: { calendarKey, apiKey, startDate, endDate, subcalendarIds }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { calendarKey, apiKey, startDate, endDate, subcalendarIds } = req.body || {};

    // API key: prefer server env var (more secure), fall back to client-supplied key
    const key = process.env.TEAMUP_API_KEY || apiKey;
    const calKey = process.env.TEAMUP_CALENDAR_KEY || calendarKey;

    if (!key) {
      return res.status(400).json({
        error: "TeamUp API key not configured. Add TEAMUP_API_KEY to Vercel environment variables, or enter it in Settings.",
      });
    }
    if (!calKey) {
      return res.status(400).json({
        error: "TeamUp Calendar Key not configured. Enter it in Settings.",
      });
    }

    // Build TeamUp events URL
    // Docs: https://apidocs.teamup.com/#get-events
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (subcalendarIds && subcalendarIds.length > 0) {
      subcalendarIds.forEach((id) => params.append("subcalendarId[]", id));
    }

    const teamupUrl = `https://api.teamup.com/${calKey}/events?${params.toString()}`;

    const teamupRes = await fetch(teamupUrl, {
      headers: {
        "Teamup-Token": key,
        "Content-Type": "application/json",
      },
    });

    if (!teamupRes.ok) {
      const errText = await teamupRes.text();
      // Give clear error messages for common cases
      if (teamupRes.status === 401) {
        return res.status(401).json({
          error: "TeamUp API key is invalid or expired. Check your API key in Settings.",
        });
      }
      if (teamupRes.status === 403) {
        return res.status(403).json({
          error: "TeamUp calendar key is incorrect or you don't have access to this calendar.",
        });
      }
      if (teamupRes.status === 404) {
        return res.status(404).json({
          error: "TeamUp calendar not found. Double-check your Calendar Key.",
        });
      }
      return res.status(teamupRes.status).json({ error: `TeamUp API error: ${errText}` });
    }

    const data = await teamupRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
