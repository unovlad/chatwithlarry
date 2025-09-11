# 📘 Documentation: `DefaultRetrievalText.ts`

## Purpose

`DefaultRetrievalText.ts` contains the **base fallback text** that is used when:

1. No relevant scenario is found in the `retrieval_snippets` database.
2. User opens the application for the first time and hasn't provided any context yet.
3. Need to provide a warm, friendly **"Hello state"** without being too narrow in response.

This is **"Larry's default voice"**.

---

## Structure

```ts
const DEFAULT_RETRIEVAL_TEXT = `
Hi, I'm Larry ✈️  
I'm here with you. If you're feeling nervous about flying, you can always tell me what's on your mind.  
I can share calming techniques, explain what's happening during the flight, or give simple tips to help you feel more at ease.  

You don't need to find the perfect words — just type how you feel, and I'll do my best to support you.
`;

export default DEFAULT_RETRIEVAL_TEXT;
```

---

## Usage

- **In `UploadDocumentsForm.tsx`:**

  ```tsx
  const [document, setDocument] = useState(DEFAULT_RETRIEVAL_TEXT);
  ```

- **Fallback in retrieval API route:**

  ```ts
  if (!matchedSnippet) {
    return DEFAULT_RETRIEVAL_TEXT;
  }
  ```

- **Onboarding / first-time chat UI:**
  Used as a greeting when there's no message history yet.

---

## Design Principles

1. **Warm & empathetic tone** → user should feel that the bot is _"a friend who's always there"_.
2. **Universal fallback** → suitable for both newcomers and returning users.
3. **Non-medical disclaimer (implicit)** → reminder that this is not a doctor, but support is available.
4. **Invites engagement** → encourages user to share their feelings.

---

# 📂 `retrieval_snippets.json`

This file stores **scenario-based responses** for main anxiety triggers.
Can be loaded into a **local JSON file** with structure:

- `trigger` (string[]) → keywords
- `response` (string)
- `category` (enum: onboarding, turbulence, takeoff, landing, safety, calming, distraction, qna)

---

## 🔖 Example JSON with Deep Coverage

The `retrieval_snippets.json` file contains 25+ scenarios covering:

### **Flight Phases:**

- Takeoff concerns
- Turbulence explanations
- Landing anxiety
- Cruise flight comfort

### **Physical Triggers:**

- Panic and anxiety
- Claustrophobia
- Sleep difficulties
- Noise sensitivity

### **Information Fears:**

- Engine concerns
- Safety questions
- Weather worries
- Emergency scenarios

### **Coping Strategies:**

- Breathing techniques
- Grounding exercises
- Distraction methods
- Professional help guidance

---

## Implementation Notes

- **Local Storage**: All snippets stored in JSON file, no external database needed
- **Trigger Matching**: Simple keyword matching against user input
- **Fallback Chain**: `retrieval_snippets` → `DefaultRetrievalText` → generic response
- **Categories**: Used for analytics and response optimization
- **Emojis**: Used strategically to add warmth and visual appeal

---

## Content Guidelines

1. **Empathetic Tone**: Always acknowledge feelings first
2. **Factual Information**: Provide accurate, reassuring facts
3. **Actionable Advice**: Give specific techniques users can try
4. **Professional Boundaries**: Suggest medical help when appropriate
5. **Positive Framing**: Focus on safety and normalcy

---

## Maintenance

- **Regular Updates**: Add new scenarios based on user feedback
- **A/B Testing**: Test different response variations
- **Analytics**: Track which scenarios are most used
- **Seasonal Updates**: Adjust for travel seasons and common concerns
