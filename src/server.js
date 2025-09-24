import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import pino from 'pino-http';

const PORT = process.env.PORT ?? 3030;
const app = express();

app.use(express.json());
app.use(cors());
app.use(
  pino({
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat:
          '{req.method} {req.url} {res.statusCode} - {responseTime}ms',
        hideObject: true,
      },
    },
  }),
);

app.get('/notes', (req, res) => {
  res.status(200).json({
    message: 'Retrieved all notes',
  });
});

app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({
    message: `Retrieved note with ID: ${noteId}`,
  });
});

app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

// Handling Not Found routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Handling errors
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    message: `${err.message}`,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
