import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import logger from 'morgan';
import aibot_router from './routes/aibot-route';
import user_router from './routes/auth-route';
import cognitive_assessment_router from './routes/cognitive-assessment-route';
import gameAnalyticsRouter from './routes/game-analytics-route';
import question_router from './routes/question-route';
import resource_router from './routes/resource-route';
import subject_router from './routes/subject-route';
import topic_router from './routes/topic-route';
import weakLessons_router from './routes/weaklessons-route';

dotenv.config();

const app = express();

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// Mount user router
app.use('/api/auth', user_router);
// Mount subject router
app.use('/api/subject', subject_router);
// Mount topic router
app.use('/api/topic', topic_router);
// Mount short question router
app.use('/api', question_router);
/// Mount resource route
app.use('/api/resource', resource_router);
// Mount aibot router
app.use('/api/aibot', aibot_router);
// Mount cognitive assessment router
app.use('/api/cognitive-assessment', cognitive_assessment_router);
// Mount game analytics router
app.use('/api/games', gameAnalyticsRouter);
// Mount weak lessons router
app.use('/api/weak-lessons', weakLessons_router);

app.get('/', (req, res) => {
  res.send('Company & task server is running');
});

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log('App error -> ', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
});

// catch all the unknown routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log('Server running on http://localhost:8000');
});
