require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your_app_secret';

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}
main();

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String,
});
const User = mongoose.model('User', userSchema);

const mentalResultSchema = new mongoose.Schema({
  userEmail: String,
  answers: Object,
  depressionScore: Number,
  anxietyScore: Number,
  stressScore: Number,
  timestamp: { type: Date, default: Date.now }
});
const MentalResult = mongoose.model('MentalResult', mentalResultSchema);

const voiceAnalysisSchema = new mongoose.Schema({
  userEmail: String,
  pitch: Number,
  speed: Number,
  emotion: String,
  mood: String,
  timestamp: { type: Date, default: Date.now }
});
const VoiceAnalysis = mongoose.model('VoiceAnalysis', voiceAnalysisSchema);

// Middleware to protect routes - verifies JWT token
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // contains email or other info embedded in token
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Token invalid' });
  }
}

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Please enter a valid email.' });

    // Password strength validation
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    // Create JWT token valid for 7 days
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Account created!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.Please create an account.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password incorrect' });

    // Create JWT token valid for 7 days
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login successful!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password route remains unchanged but can be protected later
app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found. Please create an account.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/mentalhealthresults', requireAuth, async (req, res) => {
  try {
    const { userEmail, answers, depressionScore, anxietyScore, stressScore } = req.body;
    if (req.user.email !== userEmail) {
      return res.status(403).json({ error: 'Forbidden: Email mismatch' });
    }
    const result = new MentalResult({
      userEmail,
      answers,
      depressionScore,
      anxietyScore,
      stressScore,
    });
    await result.save();
    res.json({ message: 'Saved Successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('/mentalhealthresults/:email', requireAuth, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: 'Forbidden: Email mismatch' });
    }
    const results = await MentalResult.find({ userEmail: req.params.email }).sort({ timestamp: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.post('/recommendations', requireAuth, async (req, res) => {
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
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You answer as a concise JSON-generating assistant.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://yourapp.com',
          'X-Title': 'MindCareApp',
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      }
    );
    let textOut = routerResp.data.choices?.[0]?.message?.content || '';
    textOut = textOut.match(/{[\s\S]*}/)?.[0] || textOut;

    // Sanitize common malformed JSON from LLM (double quotes inside strings)
    let safeTextOut = textOut.replace(/""/g, '"').replace(/\\"/g, "'");

    let parsed;
    try {
      parsed = JSON.parse(safeTextOut);
    } catch (jsonErr) {
      throw new Error('Could not parse OpenRouter JSON: ' + safeTextOut);
    }
    res.json(parsed);
  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    res.status(200).json({
      meditations: [
        { title: 'Practice Mindfulness', url: 'https://www.youtube.com/embed/O-6f5wQXSu8' },
        { title: 'Deep Breathing', url: 'https://youtu.be/acUZdGd_3Dg?si=Fym8bGyVpDbHdE97' },
      ],
      musics: [
        { title: 'Calm Piano', url: 'https://youtu.be/hlWiI4xVXKY?si=Hpgf_9TGtkBU8ZAY' },
        { title: 'Nature Sounds', url: 'https://www.youtube.com/embed/eKFTSSKCzWA' },
      ],
      quotes: [
        'Do something today that your future self will thank you for.',
        "It always seems impossible until it's done.",
      ],
      affirmations: ['You are enough.', 'Breathe, and let go.'],
      tips: ['Take a short mindful walk outdoors.', 'Try 5 minutes of deep breathing.'],
    });
  }
});

// Add this route to handle voice analysis results
app.post('/voice-analysis', requireAuth, async (req, res) => {
  try {
    const { userEmail, pitch, speed, emotion, mood, timestamp } = req.body;
    
    if (req.user.email !== userEmail) {
      return res.status(403).json({ error: 'Forbidden: Email mismatch' });
    }

    // Create a schema for voice analysis results
    const VoiceAnalysis = mongoose.model('VoiceAnalysis', new mongoose.Schema({
      userEmail: String,
      pitch: Number,
      speed: Number,
      emotion: String,
      mood: String,
      timestamp: { type: Date, default: Date.now }
    }));

    const analysis = new VoiceAnalysis({
      userEmail,
      pitch,
      speed,
      emotion,
      mood,
      timestamp: timestamp || Date.now()
    });

    await analysis.save();
    res.json({ message: 'Voice analysis saved successfully', data: analysis });
  } catch (err) {
    console.error('Voice analysis save error:', err);
    res.status(500).json({ error: 'Failed to save voice analysis' });
  }
});

// Get voice analysis history
app.get('/voice-analysis/:email', requireAuth, async (req, res) => {
  try {
    if (req.user.email !== req.params.email) {
      return res.status(403).json({ error: 'Forbidden: Email mismatch' });
    }
    
    const VoiceAnalysis = mongoose.model('VoiceAnalysis');
    const results = await VoiceAnalysis.find({ 
      userEmail: req.params.email 
    }).sort({ timestamp: -1 }).limit(20);
    
    res.json(results);
  } catch (err) {
    console.error('Voice analysis fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch voice analysis' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => console.log(`API running on port ${PORT}`));