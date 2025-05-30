# 🎨 x-draw-frontend

A collaborative whiteboard application built with **Next.js**. Draw, sketch, and collaborate in real-time with others, similar to Excalidraw but with our own unique features and approach.

## ✨ Features

- 🖊️ **Real-time Drawing** - Smooth drawing experience with perfect-freehand
- 👥 **Live Collaboration** - Multiple users can draw simultaneously
- 🔗 **Document Sharing** - Share your whiteboard with others via unique links
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Rich Drawing Tools** - Various brushes, shapes, and styling options
- 💾 **Auto-save** - Your work is automatically saved as you draw
- 🎯 **Rough.js Integration** - Hand-drawn style shapes and elements

## 🚀 Getting Started

### 1. 📄 Setup Environment Variables

Create a `.env.local` file in the root of the project:

```bash
cp .env.example .env.local
```

Configure your environment variables (WebSocket server URL, etc.).

### 2. 🔧 Install Dependencies

Make sure you're in the project directory and run:

```bash
npm install
```

### 3. 🏃‍♂️ Run Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 4. 🔨 Build for Production

To create a production build:

```bash
npm run build
npm start
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.1 with React 19
- **Styling**: Tailwind CSS 4.0
- **Drawing Engine**: Perfect-freehand for smooth strokes
- **Shapes**: Rough.js for hand-drawn style elements
- **State Management**: Jotai for reactive state
- **Real-time**: WebSocket connection to backend
- **Storage**: IndexedDB (via idb) for offline persistence
- **Animations**: GSAP for smooth interactions
- **Icons**: React Icons
- **HTTP Client**: Axios for API calls

## 📦 Key Dependencies

- **next**: React framework with SSR/SSG
- **perfect-freehand**: Smooth drawing stroke generation
- **roughjs**: Hand-drawn style shapes and sketches
- **jotai**: Primitive and flexible state management
- **gsap**: High-performance animations
- **idb**: IndexedDB wrapper for offline storage
- **unique-names-generator**: Generate unique room/document names

## 🎯 Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Create optimized production build
- `npm run start`: Start production server
- `npm run lint`: Run ESLint for code quality

## 🏗️ Project Structure

```plaintext
x-draw-frontend/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and Tailwind imports
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── Canvas/           # Drawing canvas components
│   ├── Toolbar/          # Drawing tools and controls
│   ├── Sidebar/          # Document management
│   └── UI/               # Common UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── store/                # Jotai atoms and state management
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── styles/               # Additional CSS files
```

## 🔧 Configuration

The app connects to the x-draw-backend WebSocket server for real-time collaboration. Make sure your backend server is running and properly configured.

### Environment Variables

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 🚀 Features in Detail

### Real-time Collaboration

- Multiple users can join the same whiteboard
- See other users' cursors and drawings in real-time
- Conflict resolution for simultaneous edits

### Drawing Tools

- Freehand drawing with pressure sensitivity
- Geometric shapes (rectangles, circles, arrows)
- Text annotations
- Color picker and brush size controls
- Eraser tool

### Document Management

- Create new whiteboards
- Save and load documents
- Share via unique URLs
- Export drawings as images

## 🔮 Future Enhancements

- Voice/video chat integration
- Advanced shape tools
- Layer management
- Template library
- Performance optimizations
- Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Notes

- This is a learning project inspired by Excalidraw
- Performance optimizations are ongoing
- Some features may be experimental

## 📄 License

MIT License - feel free to use this project for learning and development!
