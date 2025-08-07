import { createServer } from 'http';
import { readFile, readFileSync } from 'fs';
import { join, extname } from 'path';
import { URL } from 'url';

const PORT = 8000;
const HOST = 'localhost';

// Load questions once at startup
let questions = [];
try {
    const questionsData = readFileSync('quiz_questions.json', 'utf-8');
    questions = JSON.parse(questionsData);
    console.log(`✅ Loaded ${questions.length} questions`);
} catch (error) {
    console.error('❌ Error loading questions:', error);
}

const server = createServer((req, res) => {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

    if (pathname === '/' || pathname === '/quiz-simple.html') {
        serveFile(res, 'quiz-simple.html', 'text/html');
    } else if (pathname === '/quiz_questions.json') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(questions, null, 2));
    } else {
        // Serve static files
        const filePath = pathname.substring(1); // Remove leading slash
        serveStaticFile(res, filePath);
    }
});

function serveFile(res, filename, contentType) {
    const filePath = join(process.cwd(), filename);
    
    readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading ${filename}:`, err);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
    });
}

function serveStaticFile(res, filePath) {
    const fullPath = join(process.cwd(), filePath);
    
    readFile(fullPath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        const ext = extname(fullPath).toLowerCase();
        const contentType = getContentType(ext);
        
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
    });
}

function getContentType(ext) {
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
    
    return mimeTypes[ext] || 'application/octet-stream';
}

server.listen(PORT, HOST, () => {
    console.log(`🚀 Quiz server running at http://${HOST}:${PORT}/`);
    console.log(`📝 Open http://${HOST}:${PORT}/ to start the quiz`);
    console.log(`🛑 Press Ctrl+C to stop the server`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});