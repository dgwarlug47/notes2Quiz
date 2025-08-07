import { createServer } from 'http';
import { readFile, readFileSync } from 'fs';
import { join, extname } from 'path';
import { URL } from 'url';

// Configuration for different environments
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`🚀 Starting Quiz Server in ${NODE_ENV} mode`);
console.log(`📡 Host: ${HOST}, Port: ${PORT}`);

// Load questions once at startup
let questions = [];
try {
    const questionsData = readFileSync('quiz_questions.json', 'utf-8');
    questions = JSON.parse(questionsData);
    console.log(`✅ Loaded ${questions.length} questions`);
} catch (error) {
    console.error('❌ Error loading questions:', error);
    questions = []; // Fallback to empty array
}

const server = createServer((req, res) => {
    const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    
    // Enhanced CORS for development and production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Add security headers for production
    if (NODE_ENV === 'production') {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Enhanced logging
    const timestamp = new Date().toISOString();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    console.log(`[${timestamp}] ${req.method} ${pathname} - ${userAgent.substring(0, 50)}...`);

    try {
        // Security: Prevent directory traversal
        if (pathname.includes('..') || pathname.includes('~')) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden: Invalid path');
            return;
        }

        // Handle different routes
        if (pathname === '/' || pathname === '/index.html' || pathname === '/quiz-simple.html') {
            serveFile(res, 'quiz-simple.html', 'text/html');
        } else if (pathname === '/favicon.ico') {
            // Handle favicon request - return 204 No Content to avoid 404
            res.writeHead(204, { 
                'Content-Type': 'image/x-icon',
                'Cache-Control': 'public, max-age=86400' // Cache for 1 day
            });
            res.end();
        } else if (pathname === '/quiz_questions.json' || pathname === '/api/questions') {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify(questions, null, 2));
        } else {
            // Serve static files
            const filePath = pathname.substring(1); // Remove leading slash
            serveStaticFile(res, filePath);
        }
    } catch (error) {
        console.error('❌ Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
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
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`� Serving ${questions.length} questions`);
    console.log(`�🛑 Press Ctrl+C to stop the server`);
});

// Enhanced error handling
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied. Try running on a different port.`);
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📡 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n📡 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});