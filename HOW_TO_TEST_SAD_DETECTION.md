# How to Test "Sad" Emotion Detection 😢

## 📝 Words That Trigger "Sad" Detection

### Key Words (Text Sentiment Analysis):

The app looks for these words in your speech:

#### Primary Sad Words:
- **sad**
- **depressed**
- **down**
- **upset**
- **unhappy**
- **miserable**
- **hopeless**
- **lonely**

#### Secondary Sad Words:
- **crying**
- **tears**
- **hurt**
- **broken**
- **empty**
- **tired**
- **exhausted**
- **disappointed**

### Example Phrases:
Try saying phrases like:
- "I feel sad today"
- "I'm feeling down"
- "This is so upsetting"
- "I'm really unhappy"
- "I feel hopeless"
- "I'm so lonely"
- "This makes me miserable"
- "I'm feeling depressed"

---

## 🎤 Voice Characteristics for "Sad" Detection

### For Audio Analysis (More Important):

Even if you don't use sad words, your **voice tone** can trigger sad detection:

#### Voice Pattern for "Sad":
1. **Lower Pitch** (60-130 Hz)
   - Speak in a lower, deeper voice
   - Avoid high-pitched tones

2. **Lower Volume** (15-45 on scale)
   - Speak more quietly
   - Don't speak loudly or forcefully

3. **Slower Speed**
   - Speak slowly
   - Add pauses between words
   - Don't rush your speech

4. **Stable/Flat Tone**
   - Keep your voice steady (not fluctuating)
   - Avoid sudden changes in volume
   - Maintain consistent pitch

5. **No Sudden Peaks**
   - Avoid loud outbursts
   - Keep volume consistent
   - Don't raise your voice suddenly

---

## 🎭 How to Speak for "Sad" Detection:

### Voice Technique:
```
1. Take a breath
2. Lower your voice pitch
3. Speak slowly and quietly
4. Use a monotone (flat) voice
5. Add pauses: "I... feel... really... sad... today..."
6. Keep volume consistent (don't raise voice)
```

### Example (Say This Slowly & Quietly):
> "I feel really down today... everything seems so difficult... I'm just feeling sad and lonely..."

---

## 🧪 Test Scenarios:

### Scenario 1: Using Sad Words
- **Say:** "I'm feeling really sad and unhappy today"
- **Voice:** Speak normally
- **Expected:** Should detect "Sad" from text sentiment

### Scenario 2: Using Voice Tone Only
- **Say:** "Today was a normal day" (or any neutral words)
- **Voice:** Speak with lower pitch, slower, quieter
- **Expected:** Should detect "Sad" from audio characteristics

### Scenario 3: Both Words + Voice
- **Say:** "I'm feeling really down and upset" (sad words)
- **Voice:** Lower pitch, slower, quieter
- **Expected:** Strong "Sad" detection (highest confidence)

---

## 📊 Detection Priority:

1. **Text Sentiment** (if Voice module works)
   - Detects sad keywords
   - Higher priority if confidence > 70%

2. **Backend ML Analysis**
   - Analyzes 34 audio features
   - Detects emotion from voice characteristics
   - More reliable for audio patterns

3. **Real-Time Analysis**
   - Shows during recording
   - Based on pitch and volume patterns
   - Less accurate, but provides instant feedback

---

## 🎯 Tips for Best "Sad" Detection:

### ✅ DO:
- ✅ Speak slowly and quietly
- ✅ Use lower pitch (deeper voice)
- ✅ Use sad keywords: "sad", "down", "upset", "unhappy"
- ✅ Keep voice stable (no sudden changes)
- ✅ Add pauses between words
- ✅ Speak in a monotone (flat) manner

### ❌ DON'T:
- ❌ Speak loudly or forcefully
- ❌ Use high-pitched voice
- ❌ Speak quickly
- ❌ Use happy or excited words
- ❌ Have sudden volume spikes
- ❌ Use enthusiastic tone

---

## 🔍 How to Verify It Worked:

After recording, check:

1. **Emotion Result:**
   - Should show: **"Sad"** or **"Sad 😢"**

2. **Mood:**
   - Should display: **"Sad"**

3. **Pitch (if shown):**
   - Should be lower: **60-130 Hz** range

4. **Speed:**
   - Should be slower: **Lower BPM** (speech tempo)

5. **Interpretation:**
   - Should show: "💙 Your voice reflects some heaviness. It's okay to feel this way..."

6. **Support Button:**
   - **"💙 Get Support & Activities"** button should appear

---

## 🎬 Example Recording Script:

### Script 1: Subtle Sad
```
"I'm just... feeling a bit down today... 
things haven't been going well... 
I'm kind of sad about it..."
```

### Script 2: Strong Sad
```
"I'm feeling really depressed and hopeless... 
everything seems so difficult... 
I just feel so sad and lonely..."
```

### Script 3: No Sad Words (Voice Only)
```
"Today was just another day... 
nothing special happened... 
just the usual routine..."
```
*(Say this with low pitch, slow, quiet voice)*

---

## ⚠️ Important Notes:

1. **Background Noise:**
   - Find a quiet place
   - Reduce background noise
   - This improves detection accuracy

2. **Recording Length:**
   - Record for at least **5 seconds**
   - Better detection with longer recordings (10-15 seconds)

3. **Natural Expression:**
   - The app works best when you're genuinely expressing emotion
   - Don't over-act or force it

4. **Microphone Quality:**
   - Use device's built-in microphone
   - Hold device close (but not too close)
   - Avoid covering microphone

---

## 🔬 Technical Details:

### For "Sad" Detection, the Algorithm Looks For:

**Real-Time Analysis:**
- Average Volume: 15-45 (low-medium)
- Average Pitch: 60-130 Hz (low-medium)
- Volume Stability: High (consistent, not varying)
- Pitch Stability: Moderate to high
- Volume Trend: Flat or negative (not rising)
- Pitch Trend: Flat or negative (not rising)
- Peak Frequency: Low (few sudden loud sounds)

**Backend ML Analysis:**
- Extracts 34 features (MFCC, spectral, chroma)
- Uses trained SVC model
- Predicts emotion class
- Maps "Sad" to mood "Sad"

---

## 💡 Pro Tips:

1. **Combine Both:**
   - Use sad words AND sad voice tone = Best detection

2. **Be Consistent:**
   - Maintain the same voice characteristics throughout recording
   - Don't switch between emotions mid-recording

3. **Practice:**
   - Try recording a few times to see what works
   - Each person's voice is different
   - Find what works for your voice

4. **Check Results:**
   - Look at the pitch and speed values shown
   - Adjust your voice if needed
   - Lower pitch = more likely to detect as Sad

---

## 🎯 Quick Reference:

| Aspect | For "Sad" Detection |
|--------|-------------------|
| **Pitch** | Low (60-130 Hz) |
| **Volume** | Quiet (15-45) |
| **Speed** | Slow |
| **Stability** | High (consistent) |
| **Words** | sad, down, upset, unhappy, depressed |
| **Tone** | Monotone, flat |

---

**Remember: The app analyzes both what you say (words) AND how you say it (voice characteristics). Both matter!** 🎤

