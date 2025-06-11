
# JamAI Chat 🇯🇲

A modern, AI-powered chatbot that communicates in authentic Jamaican Patois. Built with React, TypeScript, and powered by Google Gemini AI.

## ✨ Features

### 🗣️ Authentic Patois Communication
- Natural Jamaican Patois responses with cultural authenticity
- Bilingual support (English and Jamaican Patois)
- Language detection for appropriate responses
- Cultural knowledge about Jamaica, food, music, and traditions

### 💬 Advanced Chat Features
- **Smart Conversations**: AI-powered responses using Google Gemini
- **Chat History**: Persistent conversation storage with up to 20 saved chats
- **Quick Suggestions**: Pre-made conversation starters about Jamaican culture
- **Typing Indicators**: Real-time visual feedback
- **New Chat**: Easy conversation reset by clicking the JamAI logo

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful, translucent interface elements
- **Jamaican Theme**: Color scheme inspired by the Jamaican flag (gold, green, black)
- **Responsive Layout**: Mobile-first design that works on all devices
- **Smooth Animations**: Polished transitions and interactions
- **Sidebar Navigation**: Easy access to chat history

### 🔧 Technical Features
- **AI Integration**: Google Gemini API for intelligent responses
- **Fallback System**: Local Patois responses when AI is unavailable
- **Local Storage**: Chat history persisted across sessions
- **Real-time Updates**: Live message updates and status indicators

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Google Gemini API key (for AI features)

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
3. When you first open JamAI Chat, you'll be prompted to enter your API key
4. The key is stored locally in your browser for future sessions

**Note**: Without an API key, the app will use local fallback responses with limited functionality.

## 🛠️ Built With

### Core Technologies
- **React 18** - UI framework
- **TypeScript** - Type safety and better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### AI & APIs
- **Google Gemini AI** - Primary AI service for intelligent responses
- **Custom Language Detection** - Patois vs English detection
- **Local Fallback System** - Backup responses when AI is unavailable

### UI Components
- **Shadcn/UI** - Modern, accessible component library
- **Lucide React** - Beautiful icons
- **React Hook Form** - Form handling
- **Sonner** - Toast notifications

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── ChatInput.tsx   # Message input component
│   ├── ChatMessage.tsx # Individual message display
│   └── ...
├── pages/              # Page components
│   └── Index.tsx       # Main chat interface
├── services/           # External service integrations
│   └── geminiService.ts # Google Gemini API client
├── utils/              # Utility functions
│   ├── patoisResponses.ts    # Local Patois responses
│   └── languageDetection.ts # Language detection logic
└── data/               # Static data files
    └── chatSuggestions.json # Conversation starters
```

## 🎯 Usage Guide

### Starting a Conversation
1. **Choose a suggestion** - Click on any of the cultural conversation starters
2. **Type freely** - Write in English or Jamaican Patois
3. **Get responses** - JamAI will respond appropriately in the detected language

### Managing Chats
- **New Chat**: Click the JamAI logo in the header
- **Chat History**: Use the sidebar to access previous conversations
- **Auto-save**: Conversations are automatically saved as you chat

### Language Features
- **English Input**: Get helpful responses about Jamaican culture in English
- **Patois Input**: Receive authentic Patois responses with cultural flair
- **Translation**: When using Patois, JamAI may offer English translations

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding New Features
1. Create focused, small components in `src/components/`
2. Use TypeScript for type safety
3. Follow the existing design system (Tailwind classes)
4. Test both English and Patois interactions

### Environment Variables
The app uses browser localStorage for configuration. No environment variables are required for basic functionality.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Jamaican Culture**: Celebrating the rich heritage and language of Jamaica
- **Google Gemini**: Powering intelligent AI responses
- **Shadcn/UI**: Beautiful, accessible component library
- **Community**: Thanks to all contributors and users

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing GitHub issues
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Made with ❤️ by Debra-Kaye Smith**

*Experience authentic Jamaican culture through AI conversation*
