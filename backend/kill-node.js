import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const isWin = process.platform === "win32";
const cmd = isWin ? "taskkill /F /IM node.exe" : "pkill -f node";

function main() {
  console.log("Kill script starting...");

  const result = spawnSync(cmd, { shell: true, encoding: "utf8" });

  console.log('DEBUG RESULT', result);

  writeFileSync(
    new URL('./kill-debug.json', import.meta.url),
    JSON.stringify(
      {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error ? result.error.message : null,
      },
      null,
      2
    )
  );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  const status = result.status ?? 0;

  const noProcessCodes = isWin ? [1, 128] : [1];
  if (noProcessCodes.includes(status)) {
    console.log("No matching Node processes were running.");
    process.exitCode = 0;
    return;
  }

  if (status === 0) {
    console.log("All Node processes terminated.");
    process.exitCode = 0;
    return;
  }

  if (result.error) {
    console.error(`Error spawning command: ${result.error.message}`);
  }

  console.error(`Error killing Node processes (exit code ${status}).`);
  process.exitCode = status || 1;
}

main();
