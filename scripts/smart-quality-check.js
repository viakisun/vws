#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 파일 유형별 품질 검증 시작...\n');

// 파일 유형별 검증 규칙
const FILE_TYPE_RULES = {
  // Svelte 컴포넌트: 엄격한 검증
  '.svelte': {
    requiredPatterns: ['handleFilterChange|handleChange|updateData'],
    forbiddenPatterns: [/\$effect\(\(\) => \{/g, /;\(/g],
    strict: true
  },
  // TypeScript 서비스: 관대한 검증
  '.ts': {
    requiredPatterns: [],
    forbiddenPatterns: [/\$effect\(\(\) => \{/g, /;\(/g],
    strict: false
  },
  // API 서버: 기본 검증
  '+server.ts': {
    requiredPatterns: [],
    forbiddenPatterns: [/\$effect\(\(\) => \{/g, /;\(/g],
    strict: false
  }
};

// 파일 유형 판별
function getFileType(filePath) {
  if (filePath.endsWith('.svelte')) return '.svelte';
  if (filePath.endsWith('+server.ts')) return '+server.ts';
  if (filePath.endsWith('.ts')) return '.ts';
  return 'unknown';
}

// 파일 검사 함수
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileType = getFileType(filePath);
  const rules = FILE_TYPE_RULES[fileType];
  
  if (!rules) return { errors: [], warnings: [] };
  
  const errors = [];
  const warnings = [];
  
  // 금지된 패턴 검사
  rules.forbiddenPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      errors.push({
        file: filePath,
        pattern: pattern.source,
        message: '금지된 패턴 사용',
        suggestion: '이벤트 기반 접근법 사용',
        count: matches.length
      });
    }
  });
  
  // 필수 패턴 검사 (엄격한 파일만)
  if (rules.strict) {
    rules.requiredPatterns.forEach(pattern => {
      const regex = new RegExp(pattern);
      if (!regex.test(content)) {
        warnings.push({
          file: filePath,
          message: '이벤트 기반 업데이트 메서드 필요',
          suggestion: 'function handleFilterChange() { updateFilteredData() }'
        });
      }
    });
  }
  
  return { errors, warnings };
}

// 모든 파일 검사
function checkAllFiles() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = [];
  
  function findFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findFiles(fullPath);
      } else if (item.endsWith('.svelte') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  findFiles(srcDir);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  const fileTypeStats = {
    '.svelte': { errors: 0, warnings: 0, files: 0 },
    '.ts': { errors: 0, warnings: 0, files: 0 },
    '+server.ts': { errors: 0, warnings: 0, files: 0 }
  };
  
  files.forEach(file => {
    const { errors, warnings } = checkFile(file);
    const fileType = getFileType(file);
    
    if (fileTypeStats[fileType]) {
      fileTypeStats[fileType].files++;
      fileTypeStats[fileType].errors += errors.length;
      fileTypeStats[fileType].warnings += warnings.length;
    }
    
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    
    if (errors.length > 0 || warnings.length > 0) {
      console.log(`📁 ${path.relative(__dirname + '/..', file)}`);
      
      errors.forEach(error => {
        console.log(`  ❌ ${error.message} (${error.count}개 발견)`);
        console.log(`     💡 ${error.suggestion}`);
      });
      
      warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning.message}`);
        console.log(`     💡 ${warning.suggestion}`);
      });
      
      console.log('');
    }
  });
  
  return { totalErrors, totalWarnings, fileTypeStats };
}

// 메인 실행
function main() {
  try {
    const { totalErrors, totalWarnings, fileTypeStats } = checkAllFiles();
    
    console.log('📊 파일 유형별 검증 결과:');
    console.log(`  ❌ 오류: ${totalErrors}개`);
    console.log(`  ⚠️  경고: ${totalWarnings}개\n`);
    
    console.log('📈 파일 유형별 통계:');
    Object.entries(fileTypeStats).forEach(([type, stats]) => {
      if (stats.files > 0) {
        console.log(`  ${type}: ${stats.files}개 파일, ${stats.errors}개 오류, ${stats.warnings}개 경고`);
      }
    });
    
    if (totalErrors > 0) {
      console.log('\n🚫 품질 검증 실패!');
      console.log('심각한 오류를 먼저 수정하세요.');
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log('\n⚠️  품질 검증 경고!');
      console.log('권장 패턴을 점진적으로 적용하세요.');
    } else {
      console.log('\n✅ 품질 검증 통과!');
    }
    
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error.message);
    process.exit(1);
  }
}

main();
