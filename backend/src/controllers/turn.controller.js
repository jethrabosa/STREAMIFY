const isIceServer = (server) =>
  server &&
  (typeof server.urls === "string" ||
    (Array.isArray(server.urls) &&
      server.urls.every((url) => typeof url === "string"))) &&
  (!server.username || typeof server.username === "string") &&
  (!server.credential || typeof server.credential === "string");

export const getTurnCredentials = async (req, res) => {
  const appName = process.env.METERED_APP_NAME;
  const apiKey = process.env.METERED_API_KEY;

  if (!appName || !apiKey) {
    return res.status(503).json({
      message: "TURN relay is not configured on the server.",
    });
  }

  try {
    const endpoint = new URL(
      `/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`,
      `https://${appName}.metered.live`
    );
    const response = await fetch(endpoint);

    if (!response.ok) {
      console.error("Metered TURN credentials request failed:", response.status);
      return res.status(502).json({
        message: "Could not retrieve TURN relay credentials.",
      });
    }

    const iceServers = await response.json();
    if (!Array.isArray(iceServers) || !iceServers.every(isIceServer)) {
      console.error("Metered returned an invalid TURN credentials response.");
      return res.status(502).json({
        message: "TURN relay returned an invalid response.",
      });
    }

    res.set("Cache-Control", "no-store");
    return res.status(200).json({ iceServers });
  } catch (error) {
    console.error("Unable to retrieve TURN credentials:", error.message);
    return res.status(502).json({
      message: "Could not retrieve TURN relay credentials.",
    });
  }
};
