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


const activeUsers = new Map();


wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  console.log('WS client connected successfully');

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      if (message.action === 'register') {
        const { userId, classe, groupe } = message.payload;

        ws.userId = userId;
    
        if (!activeUsers.has(userId)) {
          activeUsers.set(userId, {
            sockets: new Set(),
            info: { classe, groupe },
          });
        }

        activeUsers.get(userId).sockets.add(ws);

        console.log(`Utilisateur connecté : ${userId} appartenant à la classe : ${classe} et au groupe : ${groupe}`);
        
        
        console.log("-------------------------");
        console.log(`Total sockets: ${activeUsers.size}`)
        console.log("-------------------------");
      }
      else if (message.action === 'get_planning_student') {
        console.warn("WS get_planning_student executed...")

        const { userId, groupe, classe  } = message.payload;

        const filter = {
          $and: [
            { groupe: groupe },
            { classe:  classe }
          ]
        };

        const seances = await Seance.find(filter)
          .populate('moduleId')
          .sort({ jour: 1, startTime: 1 })
          .lean();

         
        
        console.warn(seances);
        
        ws.send(JSON.stringify({
          action: 'get_planning_student',
          payload: seances,
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

    ws.on('close', () => {
    const userId = ws.userId;
    if (!userId) return;

    const entry = activeUsers.get(userId);
    if (entry) {
      entry.sockets.delete(ws);
      if (entry.sockets.size === 0) {
        activeUsers.delete(userId);
        console.log(`Utilisateur ${userId} déconnecté.`);
        console.log("-------------------------");
        console.log(`Total sockets: ${activeUsers.size}`)
        console.log("-------------------------");
      }
    }
    console.log("WS client disconnected");
  });

  ws.on('error', (err) => console.error('WS Error:', err));
});



Seance.watch([], { fullDocument: 'updateLookup' }).on('change', async (change) => {
  console.warn("Seance collection changed :");
  console.log(change);

  console.warn("Active Users Map:", activeUsers);


  const updatedSeance = change.fullDocument;
  if (!updatedSeance) return;  

  const targetClasse = updatedSeance.classe;
  const targetGroupe = updatedSeance.groupe;

  

  for (const [userId, { sockets, info }] of activeUsers.entries()) {
    if (
      info.classe === targetClasse &&
      Array.isArray(targetGroupe) &&
      targetGroupe.includes(info.groupe)
    ){

      console.log(`Sending updated seance to ${userId} - ${info.classe} / ${info.groupe}`);
      
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          const allSeances = await Seance.find({ 
            classe: targetClasse, 
            groupe: { $in: [info.groupe] } 
          });

          socket.send(JSON.stringify({
            action: 'seances_updated',
            payload: allSeances,
          }));
        }
      }
    }
    else{
      console.error("NOT BROADCASTED...");
    }
  }
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
