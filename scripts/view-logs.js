#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로그 파일 경로
const logFile = path.join(__dirname, "..", "logs", "auto-validation.log");

console.log("📋 WorkStream 로그 뷰어");
console.log("========================");
console.log("");

// 로그 파일이 존재하는지 확인
if (!fs.existsSync(logFile)) {
  console.log("❌ 로그 파일이 없습니다:", logFile);
  console.log("💡 개발 서버를 실행하면 로그 파일이 생성됩니다.");
  process.exit(1);
}

// 로그 파일 크기 확인
const stats = fs.statSync(logFile);
const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`📁 로그 파일: ${logFile}`);
console.log(`📊 파일 크기: ${fileSizeInMB} MB`);
console.log(`📅 마지막 수정: ${stats.mtime.toLocaleString("ko-KR")}`);
console.log("");

// 최근 50줄 표시
console.log("📋 최근 로그 (마지막 50줄):");
console.log("========================");

const content = fs.readFileSync(logFile, "utf8");
const lines = content.split("\n").filter((line) => line.trim());
const recentLines = lines.slice(-50);

recentLines.forEach((line, index) => {
  const lineNumber = lines.length - 50 + index + 1;

  // 로그 레벨에 따른 색상 구분
  if (line.includes("ERROR") || line.includes("error")) {
    console.log(`🔴 ${lineNumber}: ${line}`);
  } else if (line.includes("WARN") || line.includes("warn")) {
    console.log(`🟡 ${lineNumber}: ${line}`);
  } else if (line.includes("INFO") || line.includes("info")) {
    console.log(`🔵 ${lineNumber}: ${line}`);
  } else if (line.includes("DEBUG") || line.includes("debug")) {
    console.log(`⚪ ${lineNumber}: ${line}`);
  } else {
    console.log(`⚫ ${lineNumber}: ${line}`);
  }
});

console.log("");
console.log("💡 실시간 로그를 보려면: tail -f logs/auto-validation.log");
console.log("💡 전체 로그를 보려면: cat logs/auto-validation.log");
console.log('💡 특정 키워드 검색: grep "키워드" logs/auto-validation.log');
