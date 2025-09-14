#!/usr/bin/env node

/**
 * TypeScript 오류 분석 스크립트
 * 가장 많은 오류를 발생시키는 파일들을 찾아서 우선순위를 정함
 */

import { execSync } from 'child_process';

console.log('🔍 TypeScript 오류 분석 시작...');

try {
  // svelte-check 실행하여 오류 정보 수집
  const output = execSync('npm run check 2>&1', { encoding: 'utf8', stdio: 'pipe' });
  
  // 파일별 오류 수 집계
  const fileErrors = new Map();
  const errorLines = output.split('\n');
  
  let currentFile = '';
  
  for (const line of errorLines) {
    // 파일 경로 추출
    const fileMatch = line.match(/^([^:]+):(\d+):(\d+)/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      if (!fileErrors.has(currentFile)) {
        fileErrors.set(currentFile, 0);
      }
      fileErrors.set(currentFile, fileErrors.get(currentFile) + 1);
    }
  }
  
  // 오류 수가 많은 순으로 정렬
  const sortedFiles = Array.from(fileErrors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // 상위 10개 파일
  
  console.log('\n📊 오류가 가장 많은 파일들:');
  console.log('=====================================');
  
  sortedFiles.forEach(([file, count], index) => {
    const relativeFile = file.replace(process.cwd() + '/', '');
    console.log(`${index + 1}. ${relativeFile} - ${count}개 오류`);
  });
  
  // 오류 타입별 집계
  const errorTypes = new Map();
  
  for (const line of errorLines) {
    if (line.includes('Error:') || line.includes('Warning:')) {
      // 오류 타입 추출 (첫 번째 부분)
      const errorMatch = line.match(/Error:\s*(.+?)(?:\s*at\s|$)/);
      if (errorMatch) {
        const errorType = errorMatch[1].trim();
        errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
      }
    }
  }
  
  // 오류 타입별 정렬
  const sortedErrorTypes = Array.from(errorTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('\n🔧 가장 빈번한 오류 타입들:');
  console.log('=====================================');
  
  sortedErrorTypes.forEach(([errorType, count], index) => {
    console.log(`${index + 1}. ${errorType} - ${count}개`);
  });
  
  // 총 오류 수
  const totalErrors = Array.from(fileErrors.values()).reduce((sum, count) => sum + count, 0);
  console.log(`\n📈 총 오류 수: ${totalErrors}개`);
  
  // 개선 제안
  console.log('\n💡 개선 제안:');
  console.log('=====================================');
  console.log('1. 상위 3개 파일의 오류부터 우선 수정');
  console.log('2. 가장 빈번한 오류 타입을 패턴별로 일괄 수정');
  console.log('3. 타입 정의 개선 (interface, type alias)');
  console.log('4. null/undefined 체크 강화');
  
} catch (error) {
  console.error('❌ 오류 분석 실패:', error.message);
  process.exit(1);
}
