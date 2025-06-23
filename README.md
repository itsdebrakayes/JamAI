
# JamAI Chat 🇯🇲

A modern, AI-powered chatbot that communicates in authentic Jamaican Patois with advanced memory capabilities and personalized experiences. Built with React, TypeScript, and powered by Google Gemini AI with Supabase backend.

## ✨ Key Features

### 🧠 Advanced AI Memory System
- **Smart Memory Storage**: AI remembers your conversations, preferences, and important information
- **Categorized Memory**: Automatically categorizes memories (recipes, preferences, recommendations, facts, conversations)
- **Importance Scoring**: Prioritizes important information for better context
- **Memory Expiration**: Automatic cleanup of temporary memories while preserving important ones
- **Cross-Device Sync**: Memories sync across all your devices when signed in
- **Enhanced Context**: Uses stored memories to provide more personalized responses

### 🗣️ Authentic Patois Communication
- **Natural Jamaican Patois**: Responds in authentic Jamaican Patois with cultural accuracy
- **Bilingual Support**: Seamlessly switches between English and Jamaican Patois
- **Language Detection**: Automatically detects input language for appropriate responses
- **Cultural Knowledge**: Deep understanding of Jamaica, food, music, and traditions
- **Translation Mode**: Optional translation between Patois and English

### 🔐 User Authentication & Personalization
- **Secure Authentication**: Full user authentication system with Supabase
- **User Profiles**: Customizable user profiles with preferences
- **Subscription Tiers**: Free, JamAI Plus, and JamAI Ultra plans with different limits
- **Usage Tracking**: Monitor your daily message and media upload usage
- **API Key Management**: Store and manage your own AI service API keys securely

### 💬 Advanced Chat Features
- **Persistent Chat Sessions**: Save and organize multiple chat conversations
- **Auto-Generated Titles**: Smart chat titles based on conversation content
- **Chat History**: Access all your previous conversations across devices
- **Real-time Sync**: Live updates when using multiple devices
- **Message Types**: Support for text, media, and structured responses
- **Quick Suggestions**: Pre-made conversation starters about Jamaican culture

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful, translucent interface elements
- **Jamaican Theme**: Color scheme inspired by the Jamaican flag (gold, green, black)
- **Responsive Layout**: Mobile-first design that works on all devices
- **Dark/Light Mode**: Theme toggle for user preference
- **Smooth Animations**: Polished transitions and interactions
- **Sidebar Navigation**: Easy access to chat history and settings

### 🔊 Audio Features
- **Text-to-Speech**: AI responses can be spoken aloud
- **Voice Recognition**: Speak your messages instead of typing
- **ElevenLabs Integration**: High-quality voice synthesis
- **Multiple Voice Options**: Choose from different voice styles

### 🌍 Location & Maps Integration
- **Location Awareness**: AI can provide location-specific information
- **Google Maps Integration**: Visual maps and directions when relevant
- **Jamaican Places**: Detailed knowledge of Jamaican locations and attractions

### 📊 Analytics & Insights
- **Memory Statistics**: View your stored memories by category and importance
- **Usage Analytics**: Track your API usage and subscription limits
- **Chat Analytics**: See conversation patterns and history

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Google Gemini API key (for AI features)
- Supabase account (for data persistence)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jamai-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Configuration

#### Google Gemini API Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enter your API key in the app settings or when prompted
4. The key is stored securely and synced across devices

#### Optional Services
- **ElevenLabs**: For premium text-to-speech (requires API key)
- **OpenAI**: Alternative AI service (requires API key)
- **Google Maps**: For location features (configured server-side)

**Note**: The app works with basic functionality without additional API keys, using fallback responses.

## 🛠️ Built With

### Core Technologies
- **React 18** - Modern UI framework
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### Backend & Database
- **Supabase** - Backend-as-a-Service for authentication, database, and real-time features
- **PostgreSQL** - Robust database with advanced features
- **Row Level Security** - Secure data access with user-based permissions
- **Real-time Subscriptions** - Live updates across devices

### AI & APIs
- **Google Gemini AI** - Primary AI service for intelligent responses
- **OpenAI** - Alternative AI service option
- **ElevenLabs** - Premium text-to-speech synthesis
- **Custom Language Detection** - Patois vs English detection
- **Local Fallback System** - Backup responses when AI is unavailable

### UI Components & Libraries
- **Shadcn/UI** - Modern, accessible component library
- **Lucide React** - Beautiful icons
- **React Hook Form** - Advanced form handling
- **Sonner** - Toast notifications
- **React Router** - Client-side routing
- **TanStack Query** - Advanced data fetching and caching

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── ChatInput.tsx   # Message input with voice support
│   ├── ChatMessage.tsx # Individual message display
│   ├── MemoryStats.tsx # Memory system statistics
│   ├── UserProfile.tsx # User profile management
│   └── ...
├── pages/              # Page components
│   ├── Index.tsx       # Main chat interface
│   ├── Auth.tsx        # Authentication page
│   └── ...
├── services/           # External service integrations
│   ├── memoryService.ts      # Enhanced AI memory system
│   ├── geminiService.ts      # Google Gemini API client
│   ├── elevenLabsService.ts  # Text-to-speech service
│   └── ...
├── utils/              # Utility functions
│   ├── chatHistory.ts        # Chat session management
│   ├── patoisResponses.ts    # Local Patois responses
│   ├── languageDetection.ts # Language detection logic
│   └── ...
├── contexts/           # React context providers
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
│   ├── useSubscription.ts    # Subscription management
│   ├── useSpeech.ts         # Speech synthesis
│   └── ...
└── data/               # Static data files
    ├── chatSuggestions.json  # Conversation starters
    └── locationSuggestions.json # Location prompts
```

## 🎯 Usage Guide

### Getting Started
1. **Sign Up/Sign In** - Create an account or sign in to sync your data
2. **Set API Keys** - Add your AI service API keys in settings (optional)
3. **Start Chatting** - Begin with suggested prompts or ask anything

### Memory System
- **Automatic Learning** - The AI automatically remembers important information
- **View Memory Stats** - Check what the AI remembers about you
- **Manage Memories** - Clear or sync memories as needed
- **Personalized Responses** - Get better responses based on your history

### Chat Features
- **New Conversations** - Click the JamAI logo to start fresh
- **Save Conversations** - All chats are automatically saved
- **Chat History** - Access previous conversations from the sidebar
- **Voice Features** - Use microphone for input or speaker for output

### Subscription Tiers
- **Free**: 50 messages/day, 5 media uploads, basic features
- **JamAI Plus**: 500 messages/day, 20 media uploads, premium features
- **JamAI Ultra**: Unlimited usage, all features, priority support

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Setup
The app uses Supabase for backend services. Key configuration:
- Authentication is handled automatically
- Database tables are created via migrations
- Real-time features work out of the box

### Adding New Features
1. Create focused, small components in `src/components/`
2. Use TypeScript for type safety
3. Follow the existing design system (Tailwind classes)
4. Test both English and Patois interactions
5. Consider memory system integration for personalization

## 🗄️ Database Schema

### Core Tables
- **profiles** - User profile information and preferences
- **chat_sessions** - Chat conversation metadata
- **messages** - Individual chat messages
- **user_memories** - AI memory system data
- **usage_tracking** - User usage statistics
- **user_api_keys** - Encrypted API key storage

### Advanced Features
- **Row Level Security** - User data isolation
- **Real-time Subscriptions** - Live updates
- **Automatic Triggers** - Profile creation, title generation
- **Memory Cleanup** - Automatic expired memory removal

## 🚀 Deployment

### Supabase Setup
1. Create a Supabase project
2. Run the provided SQL migrations
3. Configure authentication providers
4. Set up edge functions (optional)

### Environment Variables
The app uses Supabase configuration:
- Project URL and keys are configured in the client
- API keys are stored securely in the database
- No environment variables needed for basic setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use the existing component patterns
- Test both authenticated and non-authenticated flows
- Ensure memory system integration where appropriate
- Maintain Jamaican cultural authenticity

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Jamaican Culture** - Celebrating the rich heritage and language of Jamaica
- **Google Gemini** - Powering intelligent AI responses
- **Supabase** - Providing robust backend infrastructure
- **Shadcn/UI** - Beautiful, accessible component library
- **Community** - Thanks to all contributors and users

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing GitHub issues
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs
4. For memory system issues, check your subscription tier and usage limits

## 🔮 Roadmap

- **Enhanced Voice Features** - More natural speech recognition
- **Advanced Memory Categories** - Custom memory organization
- **Mobile App** - Native mobile application
- **API Access** - Public API for developers
- **Custom Themes** - User-customizable interface themes
- **Group Chats** - Multi-user conversation support

---

**Made with ❤️ by Debra-Kaye Smith**

*Experience authentic Jamaican culture through AI conversation with advanced memory and personalization*

