
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.route';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('RAG Pipeline API is running!');
});

export default app;
