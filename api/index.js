// api/index.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(uri);
  isConnected = true;
  console.log('MongoDB connected');
}

// MongoDB models
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const mentalResultSchema = new mongoose.Schema({
  userEmail: String,
  answers: Object,
  depressionScore: Number,
  anxietyScore: Number,
  stressScore: Number,
  timestamp: { type: Date, default: Date.now }
});
const MentalResult = mongoose.models.MentalResult || mongoose.model('MentalResult', mentalResultSchema);

// Routes
app.post('/signup', async (req, res) => {
  await connectDB();
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Account created!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  await connectDB();
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password incorrect' });
    res.json({ message: 'Login successful!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/reset-password', async (req, res) => {
  await connectDB();
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found. Please create an account.' });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/mentalhealthresults', async (req, res) => {
  await connectDB();
  try {
    const { userEmail, answers, depressionScore, anxietyScore, stressScore } = req.body;
    const result = new MentalResult({ userEmail, answers, depressionScore, anxietyScore, stressScore });
    await result.save();
    res.json({ message: 'Saved Successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/mentalhealthresults/:email', async (req, res) => {
  await connectDB();
  try {
    const results = await MentalResult.find({ userEmail: req.params.email }).sort({ timestamp: -1 });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

const axios = require('axios');
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;

app.post('/recommendations', async (req, res) => {
  const { depression, anxiety, stress, mood } = req.body;
  try {
    const prompt = `
You are a digital wellness coach for a mental health app.
Given scores:
- Depression: ${depression}
- Anxiety: ${anxiety}
- Stress: ${stress}
- Mood: ${mood}

Respond with this JSON, and ONLY this JSON:
{
  "meditations": [{"title": "...", "url": "..."}, ...],
  "musics": [{"title": "...","url": "..."},...],
  "quotes": ["...","..."],
  "affirmations": ["...","..."],
  "tips": ["...","..."]
}
No explanation, comments, or markdown.
`.trim();

    const routerResp = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You answer as a concise JSON-generating assistant." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://mind-care-app.com",
          "X-Title": "MindCareApp",
          "Content-Type": "application/json"
        },
        timeout: 90000
      }
    );

    let textOut = routerResp.data.choices?.[0]?.message?.content || '';
    textOut = textOut.match(/{[\s\S]*}/)?.[0] || textOut;
    let parsed;
    try {
      parsed = JSON.parse(textOut);
    } catch (jsonErr) {
      throw new Error("Could not parse OpenRouter JSON: " + textOut);
    }
    res.json(parsed);
  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    res.status(200).json({
      meditations: [
        { title: "Practice Mindfulness", url: "https://www.youtube.com/embed/O-6f5wQXSu8" },
        { title: "Deep Breathing", url: "https://youtu.be/acUZdGd_3Dg?si=Fym8bGyVpDbHdE97" }
      ],
      musics: [
        { title: "Calm Piano", url: "https://youtu.be/hlWiI4xVXKY?si=Hpgf_9TGtkBU8ZAY" },
        { title: "Nature Sounds", url: "https://www.youtube.com/embed/eKFTSSKCzWA" }
      ],
      quotes: [
        "Do something today that your future self will thank you for.",
        "It always seems impossible until it's done."
      ],
      affirmations: [
        "You are enough.",
        "Breathe, and let go."
      ],
      tips: [
        "Take a short mindful walk outdoors.",
        "Try 5 minutes of deep breathing."
      ]
    });
  }
});

module.exports = app;

// Vercel serverless function entry point
const serverless = require('serverless-http');
module.exports.handler = serverless(app);
app.listen(8000, () => console.log("Running locally"));
