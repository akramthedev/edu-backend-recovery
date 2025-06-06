require('dotenv').config();
const express      = require('express');
const http         = require('http');
const cookieParser = require('cookie-parser');
const WebSocket    = require('ws');
const cors = require('cors');
const cookieSession = require('cookie-session');
const axios = require('axios')


const connectDb       = require('./config/db');
const diversRoutes       = require('./routes/divers');
const userRoute       = require('./routes/user');
const planningRoute   = require('./routes/planning');
const Seance = require('./models/Seance');
const Notification = require('./models/Notification');

const app  = express();
const PORT = process.env.PORT || 5000;


const CLIENT_ID = "267508651605-2vqqep29h97uef9tt7ahis82dskjsm1r.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const API_KEY = "AIzaSyBhI34z9rSK7S-rfmngJ1nmb48zfb5nUz8";
const REDIRECT_URI = 'https://edu-backend.up.railway.app/auth/google/callback';


const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
];





// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(
  cookieSession({
    name: 'session',
    keys: ['666'],
    maxAge: 300 * 24 * 60 * 60 * 1000,
  })
);



// REST API Routes 
app.use('/api/auth',     diversRoutes);
app.use('/api/user',     userRoute);
app.use('/api/planning', planningRoute);


app.get('/auth/google', (req, res) => {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');  
  authUrl.searchParams.set('prompt', 'consent');  

  res.redirect(authUrl.toString());
});



app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    req.session.expires_at = Date.now() + expires_in * 1000;

    res.send(`
      <html>
        <body>
          <script>
            window.location = "edu://oauth?access_token=${access_token}&refresh_token=${refresh_token}";
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to exchange code for tokens');
  }
});





app.get('/calendar/list', async (req, res) => {
  let accessToken = req.session.access_token;
  const refreshToken = req.session.refresh_token;
  const expiresAt = req.session.expires_at;

  if (!accessToken || !refreshToken) {
    return res.status(401).send('Not authenticated');
  }

  if (Date.now() >= expiresAt) {
    try {
      const refreshResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      accessToken = refreshResponse.data.access_token;
      req.session.access_token = accessToken;
      req.session.expires_at = Date.now() + refreshResponse.data.expires_in * 1000;
    } catch (error) {
      return res.status(500).send('Failed to refresh access token');
    }
  }

  try {
    const calendarResponse = await axios.get(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    res.json(calendarResponse.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('Failed to fetch calendar list');
  }
});



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



Notification.watch([], { fullDocument: 'updateLookup' }).on('change', async (change) => {
  const updatedNotification = change.fullDocument;
  if (!updatedNotification || !updatedNotification.userId) return;

  const targetUserId = updatedNotification.userId;
  const targetUser = activeUsers.get(targetUserId);

  if (targetUser) {
    for (const socket of targetUser.sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          action: 'notification_updated',
          payload: updatedNotification,
        }));
      }
    }
    console.log("Broadcasted to user: " + targetUserId);
  } else {
    console.error("User not connected: " + targetUserId);
  }
});





 



// Server &  DataBase Connection 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDb();
});



 
