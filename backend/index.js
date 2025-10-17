import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.js';
import intakeRoutes from './routes/intake.js';
import caseParticipantsRouter from './routes/caseParticipants.js';
import usersRouter from './src/routes/users.js';
import caseOverviewRouter from './src/routes/caseOverview.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/intake', intakeRoutes);
app.use('/api/cases', caseParticipantsRouter);
app.use('/api/cases', caseOverviewRouter); // composite + activity + events
app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.send({ message: 'Divorce Mediation API running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
