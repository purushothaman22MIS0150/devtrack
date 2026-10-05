const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');
const emailRoutes = require('./routes/emailRoutes');
const searchRoutes = require('./routes/searchRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { checkDeadlines, sendReminderNow } = require('./controllers/emailController');
const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', taskRoutes);
app.use('/api/timelogs', timeLogRoutes);
app.use('/api/email', emailRoutes);
app.post('/api/email/remind-now', auth, sendReminderNow);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'DevTrack API is running' });
});

// Test DB connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected at:', result.rows[0].now);
  }
});

// Check deadlines every 24 hours
setInterval(checkDeadlines, 24 * 60 * 60 * 1000);
// Also check on server start
checkDeadlines();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});