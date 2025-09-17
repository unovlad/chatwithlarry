# 📚 Larry AI Documentation

## Overview

Larry AI is a specialized chatbot designed to help people overcome their fear of flying. The system uses a combination of empathetic conversation and contextual knowledge retrieval to provide support and information.

## Architecture

### Core Components

1. **Chat Interface** (`components/ChatWindow.tsx`)
   - Main chat interface with message limits
   - localStorage-based anonymous usage tracking
   - Auth CTA after limit reached

2. **Retrieval System** (`lib/retrieval.ts`)
   - Local JSON-based knowledge retrieval
   - Keyword matching for relevant responses
   - Fallback to default text

3. **Knowledge Base** (`data/`)
   - `DefaultRetrievalText.ts` - Fallback greeting and general info
   - `retrieval_snippets.json` - 25+ scenario-based responses

4. **API Endpoint** (`app/api/chat/route.ts`)
   - LangChain integration with OpenAI
   - Context injection from retrieval system
   - Streaming responses

## Features

### Current Implementation

- ✅ 3 free messages for anonymous users
- ✅ localStorage-based limit tracking
- ✅ Empathetic Larry personality
- ✅ Context-aware responses
- ✅ Beautiful landing page
- ✅ Auth CTA after limit

### Planned Features

- 🔄 User authentication (Supabase)
- 🔄 30 messages/month for registered users
- 🔄 Unlimited messages for premium users
- 🔄 Chat history persistence
- 🔄 Turbulence forecast
- 🔄 Stripe subscription integration

## Usage

### For Users

1. Visit the landing page
2. Start chatting with Larry
3. Ask about flight concerns, fears, or techniques
4. After 3 messages, sign up for more

### For Developers

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
```

## File Structure

```
├── app/
│   ├── api/chat/route.ts          # Main chat API
│   ├── page.tsx                   # Landing page
│   └── layout.tsx                 # App layout
├── components/
│   ├── ChatWindow.tsx             # Main chat interface
│   ├── AuthCTA.tsx                # Authentication CTA
│   └── ui/                        # shadcn/ui components
├── data/
│   ├── DefaultRetrievalText.ts    # Fallback text
│   └── retrieval_snippets.json    # Knowledge base
├── lib/
│   ├── retrieval.ts               # Retrieval system
│   └── localStorage.ts            # Local storage utilities
└── docs/
    ├── README.md                  # This file
    └── DefaultRetrievalText.md    # Detailed documentation
```

## Knowledge Base

The system uses a two-tier knowledge approach:

1. **Retrieval Snippets** - Specific responses for common scenarios
2. **Default Text** - General fallback for unmatched queries

### Categories

- `onboarding` - Welcome and introduction
- `turbulence` - Turbulence explanations
- `takeoff` - Takeoff concerns
- `landing` - Landing anxiety
- `safety` - Safety information
- `calming` - Relaxation techniques
- `distraction` - Distraction strategies
- `qna` - General Q&A

## Contributing

1. Add new scenarios to `retrieval_snippets.json`
2. Update `DefaultRetrievalText.ts` for general improvements
3. Test with various user inputs
4. Follow empathetic, supportive tone guidelines

## Support

For questions or issues, please refer to the documentation or create an issue in the repository.
