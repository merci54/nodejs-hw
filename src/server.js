import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import testRoutes from './routes/testRoutes.js';
import connectMongoDB from './db/connectMongoDB.js';
import notesRoutes from './routes/notesRoutes.js';

const PORT = process.env.PORT ?? 3030;
const app = express();

app.use(logger);
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(notesRoutes);
app.use(testRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
