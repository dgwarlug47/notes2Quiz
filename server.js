const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Function to serve static files
function serveStaticFile(filePath, response) {
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                response.writeHead(404, { 'Content-Type': 'text/html' });
                response.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                response.writeHead(500);
                response.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}

// Function to get a random question from the JSON file
function getRandomQuestion(callback) {
    fs.readFile('./quiz_questions.json', 'utf8', (err, data) => {
        if (err) {
            callback(err, null);
            return;
        }

        try {
            const questions = JSON.parse(data);
            const randomIndex = Math.floor(Math.random() * questions.length);
            const randomQuestion = questions[randomIndex];
            callback(null, randomQuestion);
        } catch (parseError) {
            callback(parseError, null);
        }
    });
}

// Create the HTTP server
const server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;

    // Set CORS headers for all requests
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`${new Date().toISOString()} - ${request.method} ${pathname}`);

    // API endpoint to get a random question
    if (pathname === '/api/random-question') {
        getRandomQuestion((err, question) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Failed to load question' }));
            } else {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(question));
            }
        });
        return;
    }

    // API endpoint to get all questions
    if (pathname === '/api/questions') {
        fs.readFile('./quiz_questions.json', 'utf8', (err, data) => {
            if (err) {
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Failed to load questions' }));
            } else {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(data);
            }
        });
        return;
    }

    // Serve the main page
    if (pathname === '/' || pathname === '/index.html') {
        serveStaticFile('./index.html', response);
        return;
    }

    // Serve static files
    const filePath = path.join(__dirname, pathname);
    
    // Security check - prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
        response.writeHead(403, { 'Content-Type': 'text/html' });
        response.end('<h1>403 - Forbidden</h1>', 'utf-8');
        return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end('<h1>404 - File Not Found</h1>', 'utf-8');
        } else {
            serveStaticFile(filePath, response);
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Quiz Server running at http://localhost:${PORT}`);
    console.log(`📚 Serving quiz questions from quiz_questions.json`);
    console.log(`🖼️  Profile picture available at /profile-pic.jpeg`);
    console.log(`\n🌐 API Endpoints:`);
    console.log(`   GET /api/random-question - Get a random question`);
    console.log(`   GET /api/questions - Get all questions`);
    console.log(`\n📁 Static files served from current directory`);
    console.log(`\nPress Ctrl+C to stop the server`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\n🛑 Server shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
    });
});
