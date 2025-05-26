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
 

const wss = new WebSocket.Server({
  server,
  perMessageDeflate: false,
  clientTracking: true,
  maxPayload: Number.MAX_SAFE_INTEGER,
});


const activeUsers = new Map();


wss.on('connection', (ws, req) => {
  

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

        console.log("-------------------------");
        console.warn(`Utilisateur ${userId} connecté`); // :  appartenant à la classe : ${classe} et au groupe : ${groupe}
        console.warn(`Utilisateurs en ligne : ${activeUsers.size}`)
        console.log("-------------------------");

      }
      else if (message.action === 'get_planning_student') {
        
        ws.send(JSON.stringify({
          action: 'get_planning_student',
          payload: "hello",
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
        console.log("-------------------------");
        console.error(`Utilisateur ${userId} déconnecté`);  
        console.error(`Utilisateurs en ligne : ${activeUsers.size}`)
        console.log("-------------------------");
      }
    }
  });

  ws.on('error', (err) => console.error('WS Error:', err));
});



Seance.watch([], { fullDocument: 'updateLookup' }).on('change', async (change) => {
  console.warn("Seance collection changed :");
  console.warn(change);

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

      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            action: 'seances_updated',
            payload: "seances updated in DATABASE"
          }));
        }
      }
    }
    else{
      console.error(`Not Broadcasted to user : ${userId}`);
    }
  }
});





 



// Server &  DataBase Connection 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDb();
});



 
