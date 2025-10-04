import { HttpError } from 'http-errors';

export default function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message || err.name,
    });
  }

  const isProd = process.env.NODE_ENV === 'production';

  console.error('Error:', err.message);
  res.status(500).json({
    message: isProd ? 'Something went wrong!' : err.message,
  });
}
