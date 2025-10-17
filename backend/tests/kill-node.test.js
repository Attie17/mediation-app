const { exec } = require('child_process');
const path = require('path');

jest.mock('child_process');

// Helper to clear require cache for kill-node.js
function requireFreshKillNode() {
  delete require.cache[require.resolve('../kill-node.js')];
  return require('../kill-node.js');
}

describe('kill-node.js cross-platform', () => {
  let originalPlatform;
  let originalConsoleError;
  let originalConsoleLog;
  let logs;
  let errors;

  beforeEach(() => {
    logs = [];
    errors = [];
    originalPlatform = process.platform;
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = (msg) => errors.push(msg);
    console.log = (msg) => logs.push(msg);
    exec.mockReset();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  it('runs taskkill on Windows', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    exec.mockImplementation((cmd, cb) => cb(null, 'killed', ''));
    requireFreshKillNode();
    expect(exec).toHaveBeenCalledWith('taskkill /F /IM node.exe', expect.any(Function));
    expect(logs.join('')).toMatch(/killed|terminated/i);
  });

  it('runs pkill on Unix', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    exec.mockImplementation((cmd, cb) => cb(null, 'killed', ''));
    requireFreshKillNode();
    expect(exec).toHaveBeenCalledWith('pkill -f node', expect.any(Function));
    expect(logs.join('')).toMatch(/killed|terminated/i);
  });

  it('logs error if exec fails', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    exec.mockImplementation((cmd, cb) => cb(new Error('fail'), '', ''));
    requireFreshKillNode();
    expect(errors.join('')).toMatch(/Error killing Node processes/);
  });

  it('logs stderr if present', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    exec.mockImplementation((cmd, cb) => cb(null, '', 'bad things'));
    requireFreshKillNode();
    expect(errors.join('')).toMatch(/bad things/);
  });
});
