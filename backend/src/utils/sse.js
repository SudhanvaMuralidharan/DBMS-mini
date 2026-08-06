let clients = [];

/**
 * Registers an Express response object as an SSE client
 */
function registerClient(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Ensure CORS is satisfied for SSE
  res.flushHeaders();

  // Send initial connection confirmation
  const initPayload = { type: 'connected', timestamp: new Date().toISOString() };
  res.write(`data: ${JSON.stringify(initPayload)}\n\n`);

  clients.push(res);

  // Clean up when client disconnects
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
}

/**
 * Broadcasts an event and data payload to all registered SSE clients
 */
function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  clients.forEach(client => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      // If writing fails, filter out this client or ignore
      console.error('[SSE] Failed to write to client:', err.message);
    }
  });
}

module.exports = {
  registerClient,
  broadcast
};
