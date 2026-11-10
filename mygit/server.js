/**
 * Car-Sharing Task Manager - Backend Server
 * Built with pure Node.js native modules (No external dependencies required)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper: Ensure data directory and file exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Helper: Read tasks from JSON file
function readTasks() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading tasks file:', err);
    return [];
  }
}

// Helper: Write tasks to JSON file
function writeTasks(tasks) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

// Helper: Send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Helper: Parse Request Body (JSON)
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // API Routes
  if (pathname.startsWith('/api/tasks')) {
    try {
      // 1. GET /api/tasks - Retrieve all tasks
      if (pathname === '/api/tasks' && method === 'GET') {
        const tasks = readTasks();
        return sendJSON(res, 200, tasks);
      }

      // 2. POST /api/tasks - Create new task
      if (pathname === '/api/tasks' && method === 'POST') {
        const body = await parseRequestBody(req);
        if (!body.text || !body.text.trim()) {
          return sendJSON(res, 400, { error: 'Task text is required' });
        }

        const tasks = readTasks();
        const newTask = {
          id: Date.now(),
          text: body.text.trim(),
          category: body.category || 'chat',
          completed: false,
          createdAt: Date.now()
        };

        tasks.unshift(newTask);
        writeTasks(tasks);
        return sendJSON(res, 201, newTask);
      }

      // 3. DELETE /api/tasks/completed - Clear completed tasks
      if (pathname === '/api/tasks/completed' && method === 'DELETE') {
        const tasks = readTasks();
        const remaining = tasks.filter(t => !t.completed);
        writeTasks(remaining);
        return sendJSON(res, 200, { message: 'Completed tasks removed', remainingCount: remaining.length });
      }

      // 4. PUT /api/tasks/:id - Update or toggle task
      const matchPut = pathname.match(/^\/api\/tasks\/(\d+)$/);
      if (matchPut && method === 'PUT') {
        const taskId = Number(matchPut[1]);
        const body = await parseRequestBody(req);
        const tasks = readTasks();
        const index = tasks.findIndex(t => t.id === taskId);

        if (index === -1) {
          return sendJSON(res, 404, { error: 'Task not found' });
        }

        tasks[index] = {
          ...tasks[index],
          ...body,
          id: taskId // Keep original ID
        };

        writeTasks(tasks);
        return sendJSON(res, 200, tasks[index]);
      }

      // 5. DELETE /api/tasks/:id - Delete single task
      const matchDelete = pathname.match(/^\/api\/tasks\/(\d+)$/);
      if (matchDelete && method === 'DELETE') {
        const taskId = Number(matchDelete[1]);
        const tasks = readTasks();
        const filtered = tasks.filter(t => t.id !== taskId);

        if (filtered.length === tasks.length) {
          return sendJSON(res, 404, { error: 'Task not found' });
        }

        writeTasks(filtered);
        return sendJSON(res, 200, { message: 'Task deleted successfully' });
      }

      // Unknown API endpoint
      return sendJSON(res, 404, { error: 'API Endpoint not found' });

    } catch (err) {
      console.error('API Error:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If file not found, fallback to index.html for SPA behavior
        fs.readFile(path.join(__dirname, 'index.html'), (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start Server
ensureDataFile();
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚗 [Car-Sharing Task Manager] Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`💾 Data: ${DATA_FILE}`);
  console.log('====================================================');
});

