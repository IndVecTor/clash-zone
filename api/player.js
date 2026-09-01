export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { tag } = req.query;
  if (!tag) {
    return res.status(400).json({ error: "Player Tag is required." });
  }

  // Tag cleanup: Remove spaces, replace 'O' with '0', remove special chars except '#'
  let rawTag = tag.trim().toUpperCase().replace(/O/g, "0").replace(/[^A-Z0-9]/g, "");
  const formattedTag = "#" + rawTag;
  const encodedTag = encodeURIComponent(formattedTag);

  // Endpoint 1: RoyaleAPI Public Supercell Gateway
  try {
    const proxyRes = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`, {
      headers: { "Accept": "application/json" }
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    console.warn("Proxy Gateway error:", err);
  }

  // Endpoint 2: Direct Supercell API with Environment Key
  const apiKey = process.env.COC_API_KEY;
  if (apiKey) {
    try {
      const supercellRes = await fetch(`https://api.clashofclans.com/v1/players/${encodedTag}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        }
      });

      if (supercellRes.ok) {
        const data = await supercellRes.json();
        return res.status(200).json(data);
      }
    } catch (err) {
      console.warn("Direct API error:", err);
    }
  }

  // Endpoint 3: Public JSON Proxy Fallback
  try {
    const backupRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`)}`);
    if (backupRes.ok) {
      const data = await backupRes.json();
      if (data && data.name) {
        return res.status(200).json(data);
      }
    }
  } catch (err) {
    console.warn("Backup proxy error:", err);
  }

  return res.status(404).json({
    error: `Tag ${formattedTag} verify nahi ho saka. Kripya check karein ki tag sahi hai ya game se dubara copy karein.`
  });
}