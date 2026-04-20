require('dotenv').config();
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');

// --- MongoDB Atlas mongodb+srv DNS (1.1.1.1 vs 8.8.8.8) — try Cloudflare → Google → both ---
const _cfDns = ['1.1.1.1', '1.0.0.1'];
const _googleDns = ['8.8.8.8', '8.8.4.4'];

function _applyMongoDns(servers) {
  dns.setServers(servers);
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
}

function _isSrvDnsFailure(err) {
  if (!err) return false;
  if (err.code === 'ECONNREFUSED' && err.syscall === 'querySrv') return true;
  const msg = String(err.message || '');
  return msg.includes('querySrv') || msg.includes('_mongodb._tcp');
}

async function connectMongooseWithDnsFallback(mongooseInstance, uri, options = {}) {
  const raw = (process.env.MONGODB_DNS_SERVERS || '').trim();
  const mode = raw.toLowerCase();

  if (mode === 'system' || mode === 'off') {
    await mongooseInstance.connect(uri, options);
    console.log('MongoDB connected');
    return;
  }

  if (raw) {
    const custom = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (custom.length) {
      _applyMongoDns(custom);
      await mongooseInstance.connect(uri, options);
      console.log('MongoDB connected (custom DNS:', custom.join(', '), ')');
      return;
    }
  }

  const strategies = [
    { label: 'Cloudflare 1.1.1.1', servers: _cfDns },
    { label: 'Google 8.8.8.8', servers: _googleDns },
    { label: 'Cloudflare + Google', servers: [..._cfDns, ..._googleDns] },
  ];

  let lastErr;
  for (const { label, servers } of strategies) {
    try {
      _applyMongoDns(servers);
      console.log('MongoDB DNS: trying', label, '→', servers.join(', '));
      await mongooseInstance.connect(uri, options);
      console.log('MongoDB connected ✓ (' + label + ')');
      return;
    } catch (err) {
      lastErr = err;
      if (_isSrvDnsFailure(err)) {
        console.warn('MongoDB DNS: retry — failed (' + label + '):', err.message || err);
        try {
          if (mongooseInstance.connection.readyState !== 0) {
            await mongooseInstance.disconnect();
          }
        } catch (_) {
          /* ignore */
        }
        continue;
      }
      throw err;
    }
  }

  console.error('MongoDB connection error:', lastErr?.message || lastErr);
  if (lastErr && _isSrvDnsFailure(lastErr)) {
    console.error(
      'All DNS strategies failed for mongodb+srv. Set MONGODB_URI_STANDARD to Atlas “standard” mongodb:// string, or fix system DNS.'
    );
  }
  throw lastErr;
}
// --- end MongoDB DNS ---

const cors = require('cors');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n🌐 ${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
  next();
});

// MONGODB_URI_STANDARD (mongodb://...) skips DNS SRV lookups — use when querySrv / _mongodb._tcp fails
// (common on some Windows networks, VPNs, or strict DNS). Atlas: Connect → choose "standard" string if offered.
const uri = process.env.MONGODB_URI_STANDARD || process.env.MONGODB_URI;
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'your_app_secret';

// Log OpenRouter key status (without exposing the key)
if (OPENROUTER_KEY) {
  const keyPrefix = OPENROUTER_KEY.substring(0, 8);
  const keySuffix = OPENROUTER_KEY.substring(OPENROUTER_KEY.length - 4);
  console.log('✓ OpenRouter API key loaded (length:', OPENROUTER_KEY.length, ')');
  console.log('  Key format:', keyPrefix + '...' + keySuffix);
  if (!OPENROUTER_KEY.startsWith('sk-or-v1-')) {
    console.error('⚠️ WARNING: API key should start with "sk-or-v1-"');
  }
} else {
  console.error('⚠️ OPENROUTER_KEY is missing from .env file!');
}

async function main() {
  if (!uri) {
    console.error('MongoDB: set MONGODB_URI or MONGODB_URI_STANDARD in .env');
    return;
  }
  try {
    await connectMongooseWithDnsFallback(mongoose, uri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
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
  console.log('🔐 Auth check for:', req.path);
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // contains email or other info embedded in token
    console.log('✅ Auth successful for:', payload.email);
    return next();
  } catch (error) {
    console.log('❌ Token invalid:', error.message);
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

// Lightweight stress-buddy chat (OpenRouter -> GPT)
app.post('/stress-chat', requireAuth, async (req, res) => {
  console.log('📥 Received stress-chat request');
  console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
  try {
    const incomingMessages = Array.isArray(req.body.messages) ? req.body.messages.slice(-8) : [];

    const systemPrompt = `
You are "Stress Buddy", a brief, warm, and practical stress-relief companion.
- Keep replies under 120 words.
- Offer 1-2 actionable tips (breathing, grounding, gentle reassurance).
- Avoid medical diagnosis or emergency advice; instead say: "If this feels urgent, please reach out to a professional or local helpline."
- Be concise, friendly, and non-judgmental.
    `.trim();

    const messages = [
      { role: 'system', content: systemPrompt },
      ...incomingMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 800),
      })),
    ];

    // Log request details for debugging (without exposing key)
    console.log('📤 Sending to OpenRouter:', {
      model: 'openai/gpt-4o-mini',
      messagesCount: messages.length,
      hasKey: !!OPENROUTER_KEY,
      keyLength: OPENROUTER_KEY?.length || 0,
    });

    const routerResp = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages,
        max_tokens: 240,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          // Use a real referer per OpenRouter policy (local or production)
          'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:8000',
          'X-Title': 'MindCareApp',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const reply = routerResp.data?.choices?.[0]?.message?.content?.trim() || 'I am here for you.';
    console.log('✓ Stress chat success, reply length:', reply.length);
    res.json({ reply });
  } catch (err) {
    const status = err.response?.status;
    const errorData = err.response?.data;
    const errorMsg = err.message;
    
    console.error('✗ Stress chat error - Status:', status);
    console.error('✗ Error message:', errorMsg);
    if (errorData) {
      console.error('✗ Error response:', JSON.stringify(errorData, null, 2));
    }
    if (err.response?.status === 401) {
      console.error('⚠️ Authentication failed - check OPENROUTER_KEY');
    } else if (err.response?.status === 404) {
      console.error('⚠️ Model not found - check model name');
    } else if (err.response?.status === 429) {
      console.error('⚠️ Rate limit exceeded');
    }
    if (!OPENROUTER_KEY) {
      console.error('⚠️ OPENROUTER_KEY is missing!');
    }
    // Heuristic fallback with a bit of variation
    const lastUser = (Array.isArray(req.body.messages) ? req.body.messages.slice(-1)[0]?.content || '' : '').toLowerCase();
    let fallback = "I'm here with you. Let's try a slow breath together: inhale for 4, hold for 4, exhale for 6.";
    if (lastUser.includes('sad') || lastUser.includes('down') || lastUser.includes('tired')) {
      fallback = "I'm sorry it's heavy right now. Let's take 3 slow breaths together. Inhale 4, hold 4, exhale 6. After that, try a tiny action you can control—like sipping water or stretching your shoulders.";
    } else if (lastUser.includes('anx') || lastUser.includes('worry') || lastUser.includes('stress')) {
      fallback = "I hear your stress. Try 5-4-3-2-1 grounding: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Slow breaths in between.";
    } else if (lastUser.includes('angry') || lastUser.includes('mad') || lastUser.includes('frustrated')) {
      fallback = "It’s okay to feel angry. Try box breathing: inhale 4, hold 4, exhale 4, hold 4. Then, write a quick note of what you can and can’t control right now.";
    } else if (lastUser.includes('happy') || lastUser.includes('good')) {
      fallback = "Glad to hear that. Maybe anchor this good moment: take a slow breath and note one thing you appreciate right now, however small.";
    }
    res.status(200).json({ reply: fallback });
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

// Test endpoint (no auth required)
app.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit!');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/test`);
  console.log(`Stress chat endpoint: http://localhost:${PORT}/stress-chat`);
});