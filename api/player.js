export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { tag } = req.query;
  if (!tag) {
    return res.status(400).json({ error: "Tag is required" });
  }

  // Sanitize Tag: O -> 0, remove invalid symbols
  let cleanTag = tag.trim().toUpperCase().replace(/O/g, "0").replace(/[^A-Z0-9]/g, "");
  const formattedTag = "#" + cleanTag;
  const encodedTag = encodeURIComponent(formattedTag);

  // Reliable CoC proxy sources
  const proxyEndpoints = [
    `https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(`https://cocproxy.royaleapi.dev/v1/players/${encodedTag}`)}`
  ];

  for (const url of proxyEndpoints) {
    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && (data.name || data.tag)) {
          return res.status(200).json(data);
        }
      }
    } catch (e) {
      console.warn("Proxy attempt failed:", url);
    }
  }

  return res.status(404).json({
    error: "Player Tag Supercell par nahi mila. Kripya apna tag dobara verify karein."
  });
}