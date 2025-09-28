# Larry AI - Flight Anxiety Support Assistant

Larry AI is a specialized chatbot designed to help people overcome their fear of flying. The system uses a combination of empathetic conversation, contextual knowledge retrieval, and real-time flight data to provide comprehensive support and information.

## 🎯 Overview

Larry AI provides 24/7 support for people experiencing flight anxiety through:

- **Empathetic AI conversations** with specialized flight anxiety knowledge
- **Real-time turbulence forecasting** using live flight data
- **Breathing exercises and calming techniques**
- **Flight safety information and statistics**
- **Personalized support based on user concerns**

## 🏗️ Technical Stack

### Frontend

- **Next.js 15.2.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering
- **Leaflet** - Interactive maps for flight tracking

### Backend & APIs

- **Next.js API Routes** - Serverless API endpoints
- **LangChain** - AI/LLM orchestration framework
- **OpenAI GPT-4** - Primary language model
- **Vercel AI SDK** - Streaming AI responses
- **Zod** - Schema validation

### Database & Authentication

- **Supabase** - PostgreSQL database with real-time features
- **Supabase Auth** - User authentication and session management
- **Row Level Security (RLS)** - Database security policies

### External Services

- **FlightAware AeroAPI** - Real-time flight tracking and route data
- **NOAA Aviation Weather Center** - Turbulence reports (PIREPs)
- **AeroDataBox API** - Alternative flight data source
- **Stripe** - Payment processing and subscriptions
- **Resend** - Email notifications

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Bundle Analyzer** - Performance monitoring

## 🚀 Features

### Core Functionality

- ✅ **Anonymous Chat** - 3 free messages for guests
- ✅ **User Authentication** - Supabase-powered auth system
- ✅ **Chat History** - Persistent conversation storage
- ✅ **Message Limits** - Tiered usage based on subscription
- ✅ **Real-time Streaming** - Live AI responses

### Premium Features

- ✅ **Turbulence Forecasting** - Real-time flight turbulence predictions
- ✅ **Flight Tracking** - Live flight position and status
- ✅ **Advanced Analytics** - Usage tracking and insights
- ✅ **Subscription Management** - Stripe-powered billing

### AI Capabilities

- ✅ **Context-Aware Responses** - Knowledge base integration
- ✅ **Empathetic Personality** - Specialized for flight anxiety
- ✅ **Breathing Exercises** - Guided relaxation techniques
- ✅ **Safety Education** - Aviation facts and statistics

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chat/                 # Chat functionality
│   │   ├── flight/               # Flight data endpoints
│   │   ├── stripe/               # Payment processing
│   │   ├── turbulence/           # Turbulence forecasting
│   │   └── user/                 # User management
│   ├── auth/                     # Authentication pages
│   ├── chat/                     # Chat interface
│   ├── forecast/                 # Weather forecasting
│   ├── plans/                    # Subscription plans
│   ├── settings/                 # User settings
│   └── turbulence/               # Turbulence interface
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── ui/                       # shadcn/ui components
│   └── ...                       # Feature components
├── lib/                          # Utility libraries
│   ├── supabaseClient.ts         # Supabase browser client
│   ├── supabaseServer.ts         # Supabase server client
│   ├── flightAwareService.ts     # Flight data service
│   ├── noaaPirepsService.ts      # Weather data service
│   └── ...                       # Other services
├── data/                         # Static data
│   ├── DefaultRetrievalText.ts   # AI knowledge base
│   └── retrieval_snippets.json   # Scenario responses
└── types/                        # TypeScript definitions
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Flight Data APIs
FLIGHTAWARE_API_KEY=your_flightaware_api_key
AERODATABOX_API_KEY=your_aerodatabox_api_key

# Payment Processing
NEXT_STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PREMIUM_PRICE_ID=your_stripe_id

# Email Service
RESEND_API_KEY=your_resend_api_key

# Optional: LangSmith Tracing
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_CALLBACKS_BACKGROUND=false
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd larry-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL scripts in the root directory to set up tables
   - Enable Row Level Security policies

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

   Services:

   Database - [https://supabase.com](https://supabase.com)
   Google Credentials (Auth) - [https://console.cloud.google.com/](https://console.cloud.google.com/)
   OpenAI GPT API - [https://platform.openai.com/](https://platform.openai.com/)
   Stripe (for payments) - [https://stripe.com/](https://stripe.com/)
   Resend (email) - [https://resend.com/](https://resend.com/)
   Flight tracking data - [https://www.flightaware.com/aeroapi/portal/documentation#overview](https://www.flightaware.com/aeroapi/portal/documentation#overview)
   Reserve flight tracking data - [https://rapidapi.com/aedbx-aedbx/api/aerodatabox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)

### Chat API

- `POST /api/chat` - Send message to Larry AI
- `POST /api/chat/create` - Create new chat session
- `GET /api/chat/[id]` - Get chat history
- `POST /api/chat/[id]/messages` - Add message to chat

### Flight Data API

- `GET /api/flight` - Get flight information
- `POST /api/turbulence` - Get turbulence forecast

### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/chats` - Get user's chat history

### Authentication

- `POST /api/auth/create-profile` - Create user profile

### Payments

- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/customer-portal` - Access customer portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## 🗄️ Database Schema

### Core Tables

- `users` - User profiles and subscription data
- `chats` - Chat sessions
- `messages` - Individual chat messages
- `subscriptions` - Stripe subscription data

### Key Features

- **Row Level Security (RLS)** - Secure data access
- **Real-time subscriptions** - Live chat updates
- **Automatic user creation** - Trigger-based profile creation

## 🔒 Security Features

- **Supabase RLS** - Database-level security
- **JWT Authentication** - Secure session management
- **API Rate Limiting** - Prevent abuse
- **Input Validation** - Zod schema validation
- **CORS Protection** - Cross-origin security
- **Content Security Policy** - XSS protection

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- **Netlify** - Static site hosting
- **Railway** - Full-stack deployment
- **DigitalOcean App Platform** - Container deployment

## 📈 Performance

- **Edge Runtime** - Fast API responses
- **Streaming Responses** - Real-time AI chat
- **Image Optimization** - Next.js automatic optimization
- **Bundle Analysis** - Performance monitoring
- **Caching** - Intelligent data caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Larry AI** - Making flying less scary, one conversation at a time. ✈️
