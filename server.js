const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const events = [
  {
    id: 1,
    name: 'Innovation Expo 2026',
    category: 'Tech',
    date: '20 Nov 2026',
    venue: 'Main Auditorium',
    price: 299,
    spotsLeft: 18,
    attendees: 142,
    mode: 'Hybrid',
    icon: '💡',
  },
  {
    id: 2,
    name: 'Cultural Fest Nights',
    category: 'Arts',
    date: '04 Dec 2026',
    venue: 'Open Air Stage',
    price: 199,
    spotsLeft: 25,
    attendees: 210,
    mode: 'On Campus',
    icon: '🎭',
  },
  {
    id: 3,
    name: 'Inter-College Sports League',
    category: 'Sports',
    date: '11 Dec 2026',
    venue: 'Sports Complex',
    price: 249,
    spotsLeft: 32,
    attendees: 186,
    mode: 'On Campus',
    icon: '🏆',
  },
  {
    id: 4,
    name: 'Leadership Summit',
    category: 'Career',
    date: '16 Jan 2027',
    venue: 'Conference Hall',
    price: 349,
    spotsLeft: 12,
    attendees: 96,
    mode: 'Offline',
    icon: '🚀',
  }
];

const registrations = [];
const feedbackItems = [];
const users = [
  {
    id: 1,
    name: 'Campus Admin',
    email: 'admin@campus.edu',
    password: 'admin123',
    role: 'admin',
  }
];

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'College Event Management System',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/events', (req, res) => {
  res.status(200).json({ events });
});

app.post('/api/events', (req, res) => {
  const { name, category, date, venue, price, mode } = req.body || {};

  if (!name || !category || !date || !venue) {
    return res.status(400).json({ message: 'Event name, category, date, and venue are required' });
  }

  const newEvent = {
    id: Date.now(),
    name,
    category,
    date,
    venue,
    price: Number(price || 0),
    spotsLeft: 40,
    attendees: 0,
    mode: mode || 'On Campus',
    icon: '🎉',
  };

  events.unshift(newEvent);
  res.status(201).json({ message: 'Event created successfully', event: newEvent });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const existingUser = users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());

  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role: 'student',
  };

  users.push(newUser);
  res.status(201).json({ message: 'Registration successful', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((entry) => entry.email.toLowerCase() === String(email || '').toLowerCase() && entry.password === String(password || ''));

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.status(200).json({
    message: 'Login successful',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

app.get('/api/registrations', (req, res) => {
  res.status(200).json({ registrations });
});

app.post('/api/registrations', (req, res) => {
  const { name, email, eventId, phone, college, message } = req.body || {};

  if (!name || !email || !eventId) {
    return res.status(400).json({ message: 'Name, email, and event selection are required' });
  }

  const event = events.find((entry) => String(entry.id) === String(eventId));
  if (!event) {
    return res.status(404).json({ message: 'Selected event was not found' });
  }

  const registration = {
    id: Date.now(),
    name,
    email,
    phone,
    college,
    message,
    eventId: Number(eventId),
    eventName: event.name,
    createdAt: new Date().toISOString(),
  };

  registrations.push(registration);
  event.spotsLeft = Math.max(0, event.spotsLeft - 1);
  event.attendees += 1;

  res.status(201).json({ message: 'Registration submitted successfully', registration });
});

app.get('/api/admin/stats', (req, res) => {
  const totalEvents = events.length;
  const totalRegistrations = registrations.length;
  const totalFeedback = feedbackItems.length;
  const totalStudents = users.filter((user) => user.role === 'student').length + totalRegistrations;

  res.status(200).json({
    stats: {
      totalEvents,
      totalRegistrations,
      totalFeedback,
      totalStudents,
    },
  });
});

app.post('/api/feedback', (req, res) => {
  const { name, email, rating, message } = req.body || {};

  if (!name || !email || !rating || !message) {
    return res.status(400).json({ message: 'Name, email, rating, and message are required' });
  }

  const item = {
    id: Date.now(),
    name,
    email,
    rating: Number(rating),
    message,
    createdAt: new Date().toISOString(),
  };

  feedbackItems.push(item);
  res.status(201).json({ message: 'Feedback submitted successfully', feedback: item });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('=======================================================');
      console.log(' College Event Management Backend Server Running');
      console.log(` Port:    http://localhost:${PORT}`);
      console.log(` Health:  http://localhost:${PORT}/api/health`);
      console.log(` Mode:    ${process.env.NODE_ENV || 'development'}`);
      console.log('=======================================================');
    });
  } catch (error) {
    console.error('Failed to launch server:', error);
    process.exit(1);
  }
};

startServer();
