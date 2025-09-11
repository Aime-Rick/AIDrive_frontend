# AIDrive

AIDrive is a modern web application that integrates Google Drive with AI capabilities, providing an intelligent file management experience. Built with React, TypeScript, and a clean UI design system.

## Features

### 🔗 Google Drive Integration
- **Seamless Authentication**: Connect your Google Drive account securely via OAuth
- **File Management**: Browse, upload, and organize files directly in your Drive
- **Folder Operations**: Create and navigate through folder structures
- **Real-time Sync**: Stay updated with your latest Drive contents

### 🤖 AI Assistant
- **Intelligent File Processing**: Process your Drive files with AI capabilities
- **Smart Search**: Enhanced search functionality across your Drive
- **File Analysis**: Get insights and assistance with your documents

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark/Light Mode**: Adaptive theming for comfortable viewing
- **Intuitive Interface**: Clean, user-friendly design built with shadcn/ui components
- **Toast Notifications**: Real-time feedback for all user actions

### 🔐 Secure Authentication
- **User Management**: Secure sign-up and sign-in functionality
- **Protected Routes**: Secure access to dashboard features
- **Account Management**: Full control over your account settings

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** for icons
- **date-fns** for date formatting

### Backend Integration
- RESTful API integration
- Google Drive API
- OAuth 2.0 authentication

### Development Tools
- **Vite** for build tooling
- **ESLint** for code quality
- Modern JavaScript/TypeScript features

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Google Cloud Console project with Drive API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=your_backend_api_url
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   ├── layout/             # Layout components
│   └── shared/             # Shared components (Sidebar, etc.)
├── pages/
│   ├── auth/               # Authentication pages
│   └── dashboard/          # Main application pages
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and API configuration
└── main.tsx               # Application entry point
```

## Key Components

### Authentication System
- **SignInPage**: User login interface
- **SignUpPage**: User registration interface
- **ProtectedRoute**: Route protection for authenticated users

### Dashboard Pages
- **DrivePage**: Main file management interface
- **AssistantPage**: AI assistant features
- **SettingsPage**: Account and integration settings

### UI Components
- **Dialog**: Modal dialogs for user interactions
- **Toast**: Notification system
- **Card**: Content containers
- **Button**: Interactive elements

## API Integration

The application integrates with a backend API for:
- User authentication and management
- Google Drive operations
- AI processing capabilities
- Connection status monitoring

### Key API Endpoints
- `/auth/*` - Authentication operations
- `/drive/*` - Google Drive operations
- `/users/*` - User management
- `/authorize` - OAuth flow initiation

## Features in Detail

### Google Drive Connection
1. Navigate to Settings page
2. Click "Connect to Google Drive"
3. Complete OAuth authorization
4. Return to the app with connected status

### File Management
- **Browse Files**: Navigate through your Drive structure
- **Upload Files**: Drag and drop or select files to upload
- **Create Folders**: Organize your content with new folders
- **Search**: Find files quickly with the search functionality

### AI Assistant
- Process files for intelligent insights
- Get AI-powered assistance with your documents
- Enhanced search and analysis capabilities

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- Consistent component structure
- Modular architecture
- Clean separation of concerns

## Security

- OAuth 2.0 for secure Google Drive access
- Protected API endpoints
- Secure token management
- User data privacy protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the repository or contact the development team.

---

**AIDrive** - Intelligent Google Drive Management with AI

**[Backend link](https://github.com/Aime-Rick/AIDrive)**
