# 📚 Vamos Argentina Quiz Generator

A dynamic quiz application that generates questions from a JSON database with an elegant web interface featuring your profile picture.

## 🚀 Features

- **Dynamic Question Loading**: Serves questions from `quiz_questions.json` via HTTP API
- **Profile Picture Display**: Shows your profile picture prominently at the top
- **Random Question Generation**: API endpoint for random question selection
- **Statistics Tracking**: Real-time accuracy and progress tracking
- **Responsive Design**: Works on desktop and mobile devices
- **CORS Enabled**: Ready for client-server architecture

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (version 14 or higher)
- Your `quiz_questions.json` file
- Your `profile-pic.jpeg` image

### Quick Start

1. **Navigate to project directory:**
   ```bash
   cd /Users/davi/Desktop/Code/notes2Quiz
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```
   
   Or using npm:
   ```bash
   npm start
   ```

3. **Open your browser:**
   ```
   http://localhost:8000
   ```

## 🌐 Server Features

### HTTP Server
- **Port**: 8000 (configurable)
- **Static File Serving**: Automatically serves HTML, CSS, JS, images
- **MIME Type Detection**: Proper content-type headers
- **Security**: Directory traversal protection
- **Error Handling**: 404 and 500 error pages

### API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/questions` | GET | Returns all questions from JSON file |
| `/api/random-question` | GET | Returns a single random question |
| `/` | GET | Serves the main quiz application |
| `/profile-pic.jpeg` | GET | Serves your profile picture |

### Example API Response
```json
{
  "questionNumber": 1,
  "timestamp": "2025-07-28T01:06:58.161Z",
  "question": "What is Claude Levi-Strauss's most famous theory?\n\nA) Social cognitive development\nB) Sociocultural evolution\nC) Structuralism\nD) Cultural diffusion",
  "response": "Correct quiz answer: C) The theory of structuralism"
}
```

## 📁 Project Structure

```
notes2Quiz/
├── server.js              # HTTP server with API endpoints
├── package.json           # Node.js project configuration
├── index.html             # Main quiz interface
├── styles.css             # Styling and responsive design
├── script.js              # Client-side quiz logic
├── quiz_questions.json    # Question database (279+ questions)
├── profile-pic.jpeg       # Your profile picture
└── README.md              # This file
```

## 🎯 How It Works

1. **Server Startup**: Node.js server starts on port 8000
2. **Question Loading**: Client fetches questions via `/api/questions`
3. **Question Parsing**: JavaScript parses various question formats
4. **User Interaction**: Click answers, get immediate feedback
5. **Statistics**: Track accuracy and progress in real-time

## 🔧 Development

### Server Logs
The server provides detailed logging:
- Request timestamps and methods
- File serving status
- API endpoint usage
- Error tracking

### Hot Reload
For development, restart the server to see changes:
```bash
# Stop server: Ctrl+C
# Restart: node server.js
```

### Adding New Questions
Simply update `quiz_questions.json` - the server will serve new questions immediately.

## 🎨 Customization

### Profile Picture
- Replace `profile-pic.jpeg` with your image
- Supported formats: JPG, JPEG, PNG, GIF
- Recommended size: Square aspect ratio

### Styling
- Edit `styles.css` to customize appearance
- Profile picture size controlled via `.profile-pic` class
- Responsive breakpoints included

### Server Configuration
Edit `server.js` to:
- Change port number (default: 8000)
- Add new API endpoints
- Modify CORS settings
- Add authentication

## 📊 Quiz Database

Your quiz contains **279+ questions** covering:
- Literature (Anna Karenina, Crime and Punishment, etc.)
- Philosophy (Nietzsche, Hegel, Existentialism)
- Politics (G7, Economics, History)
- Arts & Cinema (Architecture, Film Theory)
- Science & Mathematics (Geometry, Statistics)
- Geography (Urban Development, World Cities)

## 🚦 Server Status

When running, the server displays:
```
🚀 Quiz Server running at http://localhost:8000
📚 Serving quiz questions from quiz_questions.json
🖼️  Profile picture available at /profile-pic.jpeg

🌐 API Endpoints:
   GET /api/random-question - Get a random question
   GET /api/questions - Get all questions

📁 Static files served from current directory
```

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal to gracefully shut down the server.

---

**Enjoy testing your knowledge with the Vamos Argentina Quiz Generator!** 🇦🇷📖
