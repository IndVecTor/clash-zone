export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { tag } = req.query;
  if (!tag) {
    return res.status(400).json({ error: "Player Tag is required" });
  }

  // Clean and format tag: O -> 0, uppercase, prepend #
  let cleanTag = tag.trim().toUpperCase().replace(/O/g, "0").replace(/[^A-Z0-9]/g, "");
  const formattedTag = "#" + cleanTag;
  const encodedTag = encodeURIComponent(formattedTag);

  const COC_API_KEY = process.env.COC_API_KEY;

  // 1. Try Official Supercell API (if key is set in Vercel)
  if (COC_API_KEY) {
    try {
      const supercellRes = await fetch(`https://api.clashofclans.com/v1/players/${encodedTag}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${COC_API_KEY.trim()}`
        }
      });

      if (supercellRes.ok) {
        const data = await supercellRes.json();
        return res.status(200).json(data);
      }
    } catch (e) {
      console.warn("Supercell direct API failed, trying proxy...", e);
    }
  }

  // 2. Fallback to RoyaleAPI Public Proxy
  try {
    const proxyRes = await fetch(`https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`, {
      headers: { "Accept": "application/json" }
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return res.status(200).json(data);
    } else {
      const errData = await proxyRes.json().catch(() => ({}));
      return res.status(proxyRes.status).json({ 
        error: errData.message || "Player tag Supercell server par nahi mila! Tag check karein." 
      });
    }
  } catch (err) {
    return res.status(500).json({ error: "Supercell server connect nahi ho pa raha hai. Kripya thodi der baad try karein." });
  }
}