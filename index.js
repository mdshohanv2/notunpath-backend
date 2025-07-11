const express = require('express');
const cors = require('cors');

const OpenAI = require('openai');
require('dotenv').config({ path: 'api.env' });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Check if OpenAI API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not configured in api.env');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'OpenAI Chat API is running!',
    status: 'healthy',
    endpoints: {
      chat: 'POST /chat',
      health: 'GET /'
    }
  });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Validate request
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message.trim() }],
      max_tokens: 1000,
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;
    res.json({ 
      reply,
      usage: response.usage 
    });
  } catch (err) {
    console.error('OpenAI API Error:', err.message);
    
    if (err.status === 401) {
      res.status(401).json({ error: 'Invalid API key' });
    } else if (err.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET / (health check)');
  console.log('- POST /chat (OpenAI chat)');
});
