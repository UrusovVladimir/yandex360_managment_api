// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const accountsRoutes = require('./routes/accounts');
// const db = require('./config/database');
// const historyRoutes = require('./routes/history');
// const yandexRoutes = require('./routes/yandex/index');
// const socketHandlers = require('./sockets/socketHandlers')
// dotenv.config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: [
//       'http://localhost:5050', 
//       'http://127.0.0.1:8080', 
//       'http://localhost:8080',
//       'https://localhost:8080',
//       'https://127.0.0.1:8080'   
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
//   }
// });

// // Middleware
// app.use(cors({
//   origin: [
//     'http://localhost:5050', 
//     'http://127.0.0.1:8080', 
//     'http://localhost:8080',
//     'https://localhost:8080',
//     'https://127.0.0.1:8080'
//   ],
//   credentials: true
// }));
//   app.use(express.json());

// // Сохраняем io в app для доступа из роутов
// app.set('io', io);
// // Инициализируем socket handlers
// socketHandlers(io).initializeSocketHandlers();

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/accounts', accountsRoutes);
// app.use('/api/history', historyRoutes);
// app.use('/api/yandex', yandexRoutes);


// // Database connection
// db.connect()
//   .then(() => console.log('Connected to PostgreSQL'))
//   .catch(err => console.error('Database connection error:', err));

// const WS_PORT = process.env.WS_PORT || 5050;
// server.listen(WS_PORT, () => {
//   console.log(`Server running on port ${WS_PORT}`);
// });

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet'); // ← Добавьте эту строку
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const accountsRoutes = require('./routes/accounts');
const db = require('./config/database');
const historyRoutes = require('./routes/history');
const yandexRoutes = require('./routes/yandex/index');
const socketHandlers = require('./sockets/socketHandlers');

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🔒 Добавьте helmet ДО других middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"]
      }
    }
  }));
  console.log('Helmet security enabled for production');
}

// Остальной код остается без изменений...
const getCorsOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    return [
      `https://${process.env.DOMAIN}`,
      `https://www.${process.env.DOMAIN}`
    ];
  } else {
    return [
      'http://localhost:5050', 
      'http://127.0.0.1:8080', 
      'http://localhost:8080',
      'https://localhost:8080',
      'https://127.0.0.1:8080'   
    ];
  }
};
const corsOrigins = getCorsOrigins();

console.log('CORS origins:', corsOrigins);

const io = socketIo(server, {
  cors: {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 
  },
  // Важно для работы за Nginx proxy
  trustProxy: true
});

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());

// Trust proxy для правильных IP headers от Nginx
app.set('trust proxy', 1);

// Сохраняем io в app для доступа из роутов
app.set('io', io);

// Инициализируем socket handlers
socketHandlers(io).initializeSocketHandlers();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/yandex', yandexRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
router.get('/api/health/db', async (req, res) => {
  try {
    // Простая проверка подключения к БД
    const result = await db.query('SELECT 1 as test');
    res.status(200).json({ 
      status: 'online', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'offline', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection
db.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Database connection error:', err));

const WS_PORT = process.env.WS_PORT || 5050;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(WS_PORT, HOST, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on ${HOST}:${WS_PORT}`);
  console.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
});

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  return () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received, shutting down gracefully`);
    
    // 1. Отключаем новые соединения Socket.io
    io.engine.on("connection", (socket) => {
      socket.close(); // Закрываем новые соединения сразу
    });

    // 2. Закрываем все активные Socket.io соединения
    io.disconnectSockets(true); 

    // 3. Закрываем HTTP сервер
    server.close((err) => {
      if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('HTTP server closed');
      
      // 4. Закрываем Socket.io server
      io.close(() => {
        console.log('Socket.io server closed');
        
        // 5. Закрываем соединение с БД если есть метод disconnect
        if (db && typeof db.disconnect === 'function') {
          db.disconnect()
            .then(() => {
              console.log('Database connection closed');
              process.exit(0);
            })
            .catch((dbError) => {
              console.error('Error closing database connection:', dbError);
              process.exit(1);
            });
        } else {
          process.exit(0);
        }
      });
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
};

// Используем process.once()
process.once('SIGTERM', gracefulShutdown('SIGTERM'));
process.once('SIGINT', gracefulShutdown('SIGINT'));