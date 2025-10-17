// tests/run-post-migration.cjs
// Orchestrates all smoke suites after migrations.

const { spawn } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();


const tests = [
  {
    name: "mediator-setup",
    cmd: "powershell",
    args: [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(__dirname, "..", "setup-mediator.ps1"),
    ],
  },
  ...["test-case-participants.cjs", "test-case-dashboard.cjs", "test-uploads.cjs", "test-notifications.cjs", "test-mediator.cjs"].map((fname) => ({
    name: fname.replace(/\.cjs$/, ""),
    file: path.join(
      // Prefer backend/tests, fallback to tests/
      require("fs").existsSync(path.join(__dirname, fname))
        ? __dirname
        : path.join(__dirname, "..", "..", "tests"),
      fname
    ),
  })),
];


async function runTest(test) {
  return new Promise((resolve, reject) => {
    const prefix = `[${test.name}]`;
    let proc;
    if (test.cmd && test.args) {
      proc = spawn(test.cmd, test.args, { stdio: ["ignore", "pipe", "pipe"] });
    } else if (test.file) {
      proc = spawn("node", [test.file], { stdio: ["ignore", "pipe", "pipe"] });
    } else {
      return reject(new Error(`Test '${test.name}' missing 'file' or 'cmd/args'`));
    }
    proc.stdout.on("data", (chunk) => process.stdout.write(`${prefix} ${chunk}`));
    proc.stderr.on("data", (chunk) => process.stderr.write(`${prefix} ${chunk}`));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${test.name} failed with exit code ${code}`));
    });
  });
}

(async () => {
  let success = true;
  for (const test of tests) {
    try {
      await runTest(test);
    } catch (err) {
      console.error(`[runner] ❌ ${err.message}`);
      success = false;
      break; // stop on first failure
    }
  }
  if (success) {
    console.log("[runner] ✅ All smoke suites passed");
    process.exit(0);
  } else {
    console.error("[runner] ❌ Sweep failed");
    process.exit(1);
  }
})();
