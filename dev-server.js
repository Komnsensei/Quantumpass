import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import handlers directly (avoid dynamic imports to prevent circular dependencies)
import { default as sessionEnterHandler } from './api/session/enter.js';
import { default as sessionExitHandler } from './api/session/exit.js';
import { default as beadMintHandler } from './api/bead/mint.js';
import { default as governanceStateHandler } from './api/governance/state.js';
import { default as passGetHandler } from './api/pass/[id].js';

// Helper to create Vercel-compatible req/res objects
function createVercelReq(req) {
  return {
    method: req.method,
    body: req.body,
    query: { ...req.query, ...req.params },
    headers: req.headers
  };
}

function createVercelRes(res) {
  return {
    status: (code) => {
      res.status(code);
      return createVercelRes(res);
    },
    json: (data) => {
      res.json(data);
    }
  };
}

// Route handlers
app.post('/api/session/enter', async (req, res) => {
  try {
    const vercelReq = createVercelReq(req);
    const vercelRes = createVercelRes(res);
    await sessionEnterHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in /api/session/enter:', error);
    res.status(500).json({ error: error.message });
  }
});

app.all('/api/session/exit', async (req, res) => {
  try {
    const vercelReq = createVercelReq(req);
    const vercelRes = createVercelRes(res);
    await sessionExitHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in /api/session/exit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bead/mint', async (req, res) => {
  try {
    const vercelReq = createVercelReq(req);
    const vercelRes = createVercelRes(res);
    await beadMintHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in /api/bead/mint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/governance/state', async (req, res) => {
  try {
    const vercelReq = createVercelReq(req);
    const vercelRes = createVercelRes(res);
    await governanceStateHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in /api/governance/state:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pass/:id', async (req, res) => {
  try {
    const vercelReq = createVercelReq(req);
    const vercelRes = createVercelRes(res);
    await passGetHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Error in /api/pass/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dev API server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/session/enter');
  console.log('  GET/POST /api/session/exit');
  console.log('  POST /api/bead/mint');
  console.log('  GET /api/governance/state');
  console.log('  GET /api/pass/:id');
});
