import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Attach socket.io
  const io = new Server(server, {
     cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Staff Member Connected via Socket:', socket.id);

    // Simple broadcast for staff chat
    socket.on('send-message', (data) => {
      io.emit('receive-message', data);
    });

    socket.on('disconnect', () => {
      console.log('Staff Member Disconnected:', socket.id);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port} (Socket.io enabled)`);
    });
});
