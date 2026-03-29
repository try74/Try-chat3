
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.get('/healthz', (req, res) => res.send('OK'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on('connection', (ws) => {
  let userName = null;
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'join') {
      userName = msg.name;
      clients.set(ws, userName);
      broadcast({ type: 'system', text: `${userName} присоединился` });
    } else if (msg.type === 'message' && userName) {
      broadcast({ type: 'message', name: userName, text: msg.text });
    }
  });
  ws.on('close', () => {
    if (userName) {
      clients.delete(ws);
      broadcast({ type: 'system', text: `${userName} покинул чат` });
    }
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on ${PORT}`));
