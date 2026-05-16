const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const vercelOutput = path.join(__dirname, '.vercel', 'output');
const staticDir = path.join(vercelOutput, 'static');
const functionsDir = path.join(vercelOutput, 'functions', 'api');

fs.rmSync(vercelOutput, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(functionsDir, { recursive: true });

console.log('Installing root dependencies...');
execSync('npm install', { stdio: 'inherit', cwd: __dirname });

console.log('Building frontend...');
execSync('cd frontend && npm install --include=dev && npm run build', {
  stdio: 'inherit',
  cwd: __dirname,
});

console.log('Copying static files...');
const distDir = path.join(__dirname, 'frontend', 'dist');
for (const file of fs.readdirSync(distDir)) {
  fs.cpSync(path.join(distDir, file), path.join(staticDir, file), { recursive: true });
}

console.log('Setting up API functions...');

console.log('Bundling server with esbuild...');
execSync('npx esbuild src/server.js --bundle --platform=node --target=node20 --outfile=.vercel/output/functions/api/index.func/server-bundle.js --external:socket.io --external:express-rate-limit', {
  stdio: 'inherit',
  cwd: __dirname,
});

const apiFuncContent = `
let app;
let initError;

try {
  app = require('./server-bundle');
} catch (error) {
  initError = error;
  console.error('Server init failed:', error.message);
}

module.exports = (req, res) => {
  if (initError) {
    res.status(500).json({ error: 'Service temporarily unavailable' });
    return;
  }
  app(req, res);
};
`;

const vcConfig = {
  runtime: 'nodejs20.x',
  handler: 'index.js',
  memory: 512,
  maxDuration: 30,
  launcherType: 'Nodejs',
  shouldAddHelpers: true,
  shouldAddSourcemapSupport: false,
};

const indexDir = path.join(functionsDir, 'index.func');
fs.mkdirSync(indexDir, { recursive: true });
fs.writeFileSync(path.join(indexDir, 'index.js'), apiFuncContent);
fs.writeFileSync(path.join(indexDir, '.vc-config.json'), JSON.stringify(vcConfig, null, 2));

fs.writeFileSync(path.join(vercelOutput, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '^/api/(.*)$', dest: '/api?__path=$1' },
    { src: '/assets/(.*)', dest: '/assets/$1' },
    { src: '/(.*\\.svg)', dest: '/$1' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));

console.log('Build Output API v3 structure created!');