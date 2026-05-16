const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const vercelOutput = path.join(__dirname, '.vercel', 'output');
const staticDir = path.join(vercelOutput, 'static');
const funcDir = path.join(vercelOutput, 'functions', '[[...path]].func');

fs.rmSync(vercelOutput, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(funcDir, { recursive: true });

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

console.log('Setting up API function...');
const apiFuncContent = `
let app;
let initError;

try {
  app = require('../../../../src/server');
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
fs.writeFileSync(path.join(funcDir, 'index.js'), apiFuncContent);

fs.writeFileSync(path.join(funcDir, '.vc-config.json'), JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  memory: 512,
  maxDuration: 30,
  launcherType: 'Nodejs',
  shouldAddHelpers: true,
  shouldAddSourcemapSupport: false,
}, null, 2));

fs.writeFileSync(path.join(vercelOutput, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' },
  ],
}, null, 2));

console.log('Build Output API v3 structure created!');