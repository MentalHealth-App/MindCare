// Sentiment Analysis based on text/words
// Analyzes emotions from spoken words

// Emotion keyword dictionaries
const emotionKeywords = {
  happy: [
    'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'love', 'awesome',
    'good', 'nice', 'fun', 'smile', 'laugh', 'glad', 'pleased', 'delighted', 'cheerful',
    'ecstatic', 'thrilled', 'wonderful', 'brilliant', 'excellent', 'perfect', 'beautiful'
  ],
  sad: [
    'sad', 'depressed', 'down', 'upset', 'unhappy', 'miserable', 'hopeless', 'lonely',
    'disappointed', 'hurt', 'broken', 'cry', 'crying', 'tears', 'pain', 'suffering', 'grief',
    'sorrow', 'melancholy', 'gloomy', 'blue', 'devastated', 'heartbroken', 'discouraged',
    'tired', 'exhausted', 'weary', 'drained', 'empty', 'numb', 'sadness', 'unhappiness',
    'low', 'feeling low', 'feeling down', 'not good', 'bad', 'terrible', 'awful', 'horrible',
    'worst', 'difficult', 'hard', 'struggling', 'can\'t', 'cannot', 'don\'t want', 'do not want',
    'give up', 'quit', 'end', 'done', 'over', 'finished'
  ],
  angry: [
    'angry', 'mad', 'furious', 'annoyed', 'irritated', 'irritating', 'frustrated', 'frustrating',
    'rage', 'raging', 'hate', 'hatred', 'disgusted', 'outraged', 'livid', 'enraged', 'hostile',
    'resentful', 'bitter', 'aggressive', 'violent', 'fuming', 'seething', 'wrath', 'ire',
    'upset', 'pissed', 'annoying', 'stupid', 'idiot', 'damn', 'hell', 'screw', 'screwed'
  ],
  anxious: [
    'anxious', 'anxiety', 'worried', 'worry', 'nervous', 'nervousness', 'afraid', 'scared',
    'scary', 'fear', 'fearful', 'panic', 'panicking', 'stressed', 'stress', 'stressing',
    'tense', 'tension', 'uneasy', 'apprehensive', 'restless', 'frightened', 'terrified',
    'terrifying', 'dread', 'dreading', 'concerned', 'jittery', 'on edge', 'overwhelmed',
    'overwhelming', 'can\'t sleep', 'cannot sleep', 'racing thoughts', 'worrying'
  ],
  calm: [
    'calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'quiet', 'still', 'composed',
    'cool', 'collected', 'at ease', 'unworried', 'untroubled', 'placid', 'mellow'
  ],
  neutral: [
    'okay', 'fine', 'alright', 'normal', 'regular', 'usual', 'standard', 'typical'
  ]
};

// Calculate sentiment score from text
export const analyzeTextSentiment = (text) => {
  if (!text || text.trim().length === 0) {
    return { emotion: 'Neutral', confidence: 0, scores: {} };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  const scores = {
    happy: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    calm: 0,
    neutral: 0,
  };

  // Count keyword matches (improved matching)
  Object.keys(emotionKeywords).forEach((emotion) => {
    emotionKeywords[emotion].forEach((keyword) => {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[emotion] += matches.length; // Count multiple occurrences
      }
    });
  });

  // Calculate total score
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  // Find dominant emotion
  let maxScore = 0;
  let dominantEmotion = 'neutral';

  Object.keys(scores).forEach((emotion) => {
    if (scores[emotion] > maxScore) {
      maxScore = scores[emotion];
      dominantEmotion = emotion;
    }
  });

  // Calculate confidence (0-1)
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;

  // Capitalize first letter
  const emotionFormatted = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);

  return {
    emotion: emotionFormatted,
    confidence: confidence,
    scores: scores,
    totalKeywords: totalScore,
  };
};

// Map sentiment emotion to mood
export const sentimentToMood = (sentimentEmotion) => {
  const moodMap = {
    'Happy': 'Happy',
    'Sad': 'Sad',
    'Angry': 'Angry',
    'Anxious': 'Anxious',
    'Calm': 'Calm',
    'Neutral': 'Neutral',
  };
  return moodMap[sentimentEmotion] || 'Neutral';
};

