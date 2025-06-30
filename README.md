# Gauntlet-AI-SnapConnect
A Snapchat clone with AI features

## 🚀 Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Expo Go** app on your mobile device (for testing on physical devices)

### Installation

1. **Install dependencies**
   ```bash
   npm install 
   # or
   npm install --legacy-peer-deps
   ```

2. **Set up environment variables**
   - Create a `.env` file in the root directory
   - Add your Supabase configuration:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### Running the Project

#### Development Server

Start the Expo development server:
```bash
npx expo start
```

#### Testing on Physical Devices

1. **Install Expo Go** on your mobile device
2. **Scan the QR code** displayed in the terminal or browser
3. **Allow camera and microphone permissions** when prompted

### Project Structure

```
Gauntlet-AI-SnapConnect/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication routes
│   ├── (tabs)/            # Main tab navigation
│   ├── chat/              # Chat functionality
│   └── story/             # Story viewing
├── components/            # Reusable UI components
├── constants/             # App constants and dummy data
├── hooks/                 # Custom React hooks
├── lib/                   # API and Supabase configuration
├── providers/             # React context providers
└── supabase/              # Supabase functions and RPC
```

### Key Features

- 📱 **Cross-platform**: iOS, Android, and Web support
- 🔐 **Authentication**: Supabase-powered auth system
- 📷 **Camera Integration**: Photo capture and sharing
- 💬 **Real-time Chat**: Instant messaging capabilities
- 🗺️ **Location Services**: Map integration
- 🤖 **AI Features**: Enhanced with artificial intelligence
- 🎨 **Modern UI**: Responsive design with dark mode support

### Development Tools

- **TypeScript**: Full type safety
- **Expo Router**: File-based routing
- **React Native**: Cross-platform mobile development
- **Supabase**: Backend as a Service
- **Jotai**: State management

### Troubleshooting

#### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start --clear`
2. **Permission errors**: Ensure camera and microphone permissions are granted
3. **Build failures**: Check Node.js version compatibility
4. **Supabase connection**: Verify environment variables are correctly set

#### Getting Help

- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Native documentation](https://reactnative.dev/)
- Consult [Supabase documentation](https://supabase.com/docs)


### License

This project is licensed under the MIT License.
