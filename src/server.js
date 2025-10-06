import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { connectMongoDB } from './db/connectMongoDB.js';
import notesRouters from './routes/notesRoutes.js';

const PORT = process.env.PORT ?? 3030;
const app = express();

app.use(express.json());
app.use(cors());
app.use(logger);

app.use(notesRouters);

app.use(notFoundHandler);
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
