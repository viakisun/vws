#!/usr/bin/env node

/**
 * Accessibility 경고 자동 수정 스크립트
 * label과 input/select를 자동으로 연결
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

console.log('🔧 Accessibility 경고 자동 수정 시작...')

// 수정할 파일들 찾기
const files = glob.sync('src/**/*.svelte')

let totalFixed = 0

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf8')
    let modified = false

    // label과 input 연결 패턴 찾기
    const labelInputPattern =
      /<label([^>]*)class="([^"]*)"([^>]*)>([^<]*)<\/label>\s*<input\s*([^>]*?)>/g

    content = content.replace(
      labelInputPattern,
      (match, before, className, after, labelText, inputAttrs) => {
        // 고유한 ID 생성
        const id = `input-${Math.random().toString(36).substr(2, 9)}`

        // label에 for 속성 추가
        const newLabel = `<label${before}for="${id}" class="${className}"${after}>${labelText}</label>`

        // input에 id 속성 추가
        const newInput = `<input id="${id}" ${inputAttrs}>`

        modified = true
        return `${newLabel}\n\t\t\t\t\t${newInput}`
      }
    )

    // label과 select 연결 패턴 찾기
    const labelSelectPattern =
      /<label([^>]*)class="([^"]*)"([^>]*)>([^<]*)<\/label>\s*<select\s*([^>]*?)>/g

    content = content.replace(
      labelSelectPattern,
      (match, before, className, after, labelText, selectAttrs) => {
        // 고유한 ID 생성
        const id = `select-${Math.random().toString(36).substr(2, 9)}`

        // label에 for 속성 추가
        const newLabel = `<label${before}for="${id}" class="${className}"${after}>${labelText}</label>`

        // select에 id 속성 추가
        const newSelect = `<select id="${id}" ${selectAttrs}>`

        modified = true
        return `${newLabel}\n\t\t\t\t\t${newSelect}`
      }
    )

    if (modified) {
      writeFileSync(file, content, 'utf8')
      console.log(`✅ ${file} 수정 완료`)
      totalFixed++
    }
  } catch (error) {
    console.error(`❌ ${file} 수정 실패:`, error.message)
  }
}

console.log(`\n🎉 총 ${totalFixed}개 파일의 accessibility 경고 수정 완료!`)
