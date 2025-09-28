#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 개선된 자동 수정 스크립트 시작...\n');

// 수정할 패턴들
const FIX_PATTERNS = [
  {
    // 잘못된 함수 패턴 수정
    pattern: /}()\s*\)/g,
    replacement: '}'
  },
  {
    // 중복된 함수명 수정
    pattern: /function updateData\(\) \{[\s\S]*?\}\s*function updateData\(\)/g,
    replacement: (match) => {
      const firstFunction = match.split('function updateData()')[0] + 'function updateData()';
      const secondFunction = 'function updateData2()' + match.split('function updateData()')[2];
      return firstFunction + secondFunction;
    }
  }
];

// 파일 수정 함수
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;
    let hasChanges = false;

    // 패턴 적용
    FIX_PATTERNS.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        const matches = modifiedContent.match(pattern);
        if (matches) {
          modifiedContent = modifiedContent.replace(pattern, replacement);
          hasChanges = true;
        }
      } else {
        if (pattern.test(modifiedContent)) {
          modifiedContent = modifiedContent.replace(pattern, replacement);
          hasChanges = true;
        }
      }
    });

    // onMount import 추가 (Svelte 파일인 경우)
    if (filePath.endsWith('.svelte') && modifiedContent.includes('onMount(')) {
      if (!modifiedContent.includes("import { onMount } from 'svelte'")) {
        // 기존 import 찾기
        const importMatch = modifiedContent.match(/import.*from 'svelte'/);
        if (importMatch) {
          modifiedContent = modifiedContent.replace(
            importMatch[0],
            importMatch[0].replace("'svelte'", "'svelte'") + "\n  import { onMount } from 'svelte'"
          );
        } else {
          // 새로운 import 추가
          const scriptStart = modifiedContent.indexOf('<script');
          if (scriptStart !== -1) {
            const scriptEnd = modifiedContent.indexOf('>', scriptStart);
            modifiedContent = modifiedContent.slice(0, scriptEnd + 1) + 
              "\n  import { onMount } from 'svelte'" + 
              modifiedContent.slice(scriptEnd + 1);
          }
        }
        hasChanges = true;
      }
    }

    // 잘못된 함수 호출 수정
    if (modifiedContent.includes('loadEvidenceData()')) {
      modifiedContent = modifiedContent.replace('loadEvidenceData()', 'loadEvidenceItems()');
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      console.log(`✅ 수정 완료: ${path.relative(__dirname + '/..', filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ 수정 실패: ${filePath}`, error.message);
    return false;
  }
}

// 모든 파일 검사 및 수정
function fixAllFiles() {
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
  
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  return fixedCount;
}

// 메인 실행
function main() {
  try {
    const fixedCount = fixAllFiles();
    
    console.log(`\n📊 수정 완료: ${fixedCount}개 파일`);
    
    if (fixedCount > 0) {
      console.log('\n✅ 자동 수정 완료!');
      console.log('이제 품질 검증을 다시 실행해보세요.');
    } else {
      console.log('\n⚠️  수정할 파일이 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 자동 수정 중 오류 발생:', error.message);
    process.exit(1);
  }
}

main();
