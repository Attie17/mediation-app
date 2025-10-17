"use strict";

const { spawnSync } = require("child_process");

const isWindows = process.platform === "win32";

if (!isWindows) {
  console.log("ℹ️ This kill script currently targets Windows environments (node.exe).");
  process.exit(0);
}

const currentPid = process.pid;
const parentPid = process.ppid;

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

function parseWmicList(output) {
  if (!output || /No Instance\(s\) Available\./i.test(output)) {
    return [];
  }

  const processes = [];
  let pid = null;
  let commandLine = "";

  const lines = output.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (Number.isInteger(pid)) {
        processes.push({ pid, commandLine });
      }
      pid = null;
      commandLine = "";
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);

    if (key === "ProcessId") {
      pid = Number.parseInt(value, 10);
    } else if (key === "CommandLine") {
      commandLine = value || "";
    }
  }

  if (Number.isInteger(pid)) {
    processes.push({ pid, commandLine });
  }

  return processes;
}

function tryGetProcessesViaWmic() {
  const args = [
    "process",
    "where",
    "name='node.exe'",
    "get",
    "CommandLine,ProcessId",
    "/format:list",
  ];

  const result = run("wmic", args);

  if (result.error) {
    return null;
  }

  if (result.status !== 0) {
    const combined = `${result.stdout || ""}${result.stderr || ""}`;
    if (/No Instance\(s\) Available\./i.test(combined)) {
      return [];
    }

    return null;
  }

  return parseWmicList(result.stdout || "");
}

function getCommandLineViaPowerShell(pid) {
  const psCommand = `(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}").CommandLine`;
  const result = run("powershell", ["-NoProfile", "-Command", psCommand]);

  if (result.error || result.status !== 0) {
    return "";
  }

  return (result.stdout || "").replace(/\r?\n/g, "").trim();
}

function getProcessesViaTasklist() {
  const result = run("tasklist", ["/FI", "IMAGENAME eq node.exe", "/FO", "CSV"]);

  if (result.error || result.status !== 0) {
    throw new Error(result.error ? result.error.message : (result.stderr || "").trim() || "tasklist failed");
  }

  const lines = (result.stdout || "")
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const processes = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("\"") || !line.endsWith("\"")) {
      continue;
    }

    const parts = line.slice(1, -1).split("\",\"");
    const pid = Number.parseInt(parts[1], 10);

    if (!Number.isInteger(pid)) {
      continue;
    }

    processes.push({ pid, commandLine: getCommandLineViaPowerShell(pid) });
  }

  return processes;
}

function getNodeProcesses() {
  const viaWmic = tryGetProcessesViaWmic();
  if (Array.isArray(viaWmic)) {
    return viaWmic;
  }

  return getProcessesViaTasklist();
}

let processes;

try {
  processes = getNodeProcesses();
} catch (error) {
  console.error(`❌ Unable to enumerate node.exe processes: ${error.message}`);
  process.exit(1);
}

const exclusions = new Set([currentPid, parentPid].filter(Boolean));

const uniqueProcesses = new Map();
for (const { pid, commandLine } of processes) {
  if (Number.isInteger(pid)) {
    uniqueProcesses.set(pid, commandLine || "");
  }
}

const targets = [];
for (const [pid, commandLine] of uniqueProcesses.entries()) {
  if (exclusions.has(pid)) {
    continue;
  }

  if ((commandLine || "").toLowerCase().includes("npm-cli.js")) {
    continue;
  }

  targets.push({ pid, commandLine });
}

if (targets.length === 0) {
  console.log("ℹ️ No matching Node processes were running.");
  process.exit(0);
}

let killedCount = 0;
let hadErrors = false;

for (const { pid } of targets) {
  console.log(`Killing node.exe PID ${pid}`);

  const result = run("taskkill", ["/F", "/PID", String(pid)]);

  if (result.status === 0) {
    killedCount += 1;
  } else if (result.status === 128) {
    // Process already gone; treat as success without incrementing the counter.
  } else {
    hadErrors = true;
    const details = (result.stderr || result.stdout || "").trim() || `taskkill exited with code ${result.status}`;
    console.error(`Error terminating PID ${pid}: ${details}`);
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

if (hadErrors) {
  process.exit(1);
}

if (killedCount > 0) {
  console.log(`✅ Terminated ${killedCount} process(es)`);
} else {
  console.log("ℹ️ No matching Node processes were running.");
}

process.exit(0);
