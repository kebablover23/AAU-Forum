require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const { Server } = require('socket.io');
const connectDatabase = require('./config/database');
const noteRoutes = require('./routes/noteRoutes');
const { exposeSessionUser } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'development-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 }
});

app.set('io', io);
app.set('notificationCounts', new Map());
app.set('notifications', new Map());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(exposeSessionUser);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', noteRoutes);

app.use((error, req, res, next) => {
  if (error && (error.code === 'LIMIT_FILE_SIZE' || error.message === 'Only image files are allowed')) {
    return res.status(400).render('error', { error: error.message });
  }
  console.error(error);
  res.status(500).render('error', { error: 'Something went wrong. Please try again.' });
});

io.engine.use(sessionMiddleware);
io.on('connection', socket => {
  const user = socket.request.session?.user;
  if (!user) return;
  const userId = user._id.toString();
  socket.join(`user:${userId}`);
  socket.emit('notifications:init', {
    notifications: app.get('notifications').get(userId) || [],
    count: app.get('notificationCounts').get(userId) || 0
  });
  socket.on('conversation:join', id => socket.join(`conversation:${id}`));
  socket.on('post:join', id => socket.join(`post:${id}`));
  socket.on('event:join', id => socket.join(`event:${id}`));
  socket.on('poll:join', id => socket.join(`poll:${id}`));
  socket.on('notifications:clear', () => clearNotifications(app, io, userId, socket.request.session));
  socket.on('notifications:remove', notificationId => {
    const list = app.get('notifications').get(userId) || [];
    app.get('notifications').set(userId, list.filter(item => item.id !== notificationId));
    updateNotificationCount(app, io, userId, socket.request.session);
  });
});

function updateNotificationCount(appInstance, ioInstance, userId, sessionObject) {
  const list = appInstance.get('notifications').get(userId) || [];
  appInstance.get('notificationCounts').set(userId, list.length);
  sessionObject.notificationCount = list.length;
  sessionObject.save(() => {});
  ioInstance.to(`user:${userId}`).emit('notification:count', { count: list.length });
}

function clearNotifications(appInstance, ioInstance, userId, sessionObject) {
  appInstance.get('notifications').set(userId, []);
  updateNotificationCount(appInstance, ioInstance, userId, sessionObject);
}

async function start() {
  await connectDatabase();
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}

if (require.main === module) start();

module.exports = { app, server, io, updateNotificationCount, clearNotifications };