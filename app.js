require('dotenv').config();
const express      = require('express');
const http         = require('http');
const cookieParser = require('cookie-parser');
const WebSocket    = require('ws');

const connectDb       = require('./config/db');
const authRoute       = require('./routes/auth');
const userRoute       = require('./routes/user');
const planningRoute   = require('./routes/planning');
const Seance = require('./models/Seance');

const app  = express();
const PORT = process.env.PORT || 5000;



// Middlewares
app.use(express.json());
app.use(cookieParser());



// REST API Routes 
app.use('/api/auth',     authRoute);
app.use('/api/user',     userRoute);
app.use('/api/planning', planningRoute);



// HTTP Server & WebSocket 
const server = http.createServer(app);

const HEARTBEAT_INTERVAL = 15_000;

function noop() {}

function heartbeat() { 
    this.isAlive = true; 
}

const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: Number.MAX_SAFE_INTEGER,
});



wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  console.log('WS client connected successfully');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      if (message.action === 'get_planning') {
        console.warn("WS get_planning executed...")
        const planningData = await Seance.find({}).lean();
        
        ws.send(JSON.stringify({
          action: 'get_planning',
          payload: planningData,
        }));
      } else if(message.action === "hello_world") {

        console.warn("WS hello_world executed...")

        ws.send(JSON.stringify({
          action: 'hello_world',
          payload: "Hello World",
        }));

      } else {
        ws.send(JSON.stringify({ error: 'Unknown action' }));
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => console.log('WS client disconnected'));
  ws.on('error', (err) => console.error('WS Error:', err));
});





Seance.watch().on('change', async (change) => {
  console.log('Seances collection changed:', change);

  const planningData = await Seance.find({}).lean();

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        action: 'seances_updated',
        payload: planningData, 
      }));
    }
  });
});


Seance.watch().on('change', (change)=>{
  console.warn("--------------------");
  console.warn("Seance collection changed :");
  console.warn(change);
  console.warn("--------------------");
});





const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, HEARTBEAT_INTERVAL);




// Server &  DataBase Connection 
server.listen(PORT, () => {
  console.log(`HTTP+WS server listening on port ${PORT}`);
  connectDb();
});




// Unexpected Shutdown handled gracefully
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down…`);
    clearInterval(interval);
    wss.clients.forEach(ws => ws.terminate());
    server.close(() => {
      console.log('Server closed cleanly');
      process.exit(0);
    });
  });
});
