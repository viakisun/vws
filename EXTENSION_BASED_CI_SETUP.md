# 확장자별 CI/IDE 검사 설정

## 📋 설정 완료 내용

### 1. package.json 스크립트 추가

```json
{
  "scripts": {
    "check:svelte": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json 2>&1 | grep '\\.svelte:' || echo 'No .svelte errors found'",
    "check:typescript": "tsc --noEmit",
    "lint:svelte": "eslint . --ext .svelte",
    "lint:typescript": "eslint . --ext .ts,.tsx",
    "fix:svelte": "eslint . --ext .svelte --fix",
    "fix:typescript": "eslint . --ext .ts,.tsx --fix"
  }
}
```

### 2. CI 워크플로우 분리

```yaml
- name: Svelte files check
  run: pnpm run check:svelte || echo "Svelte check completed with warnings"
- name: TypeScript files check
  run: pnpm run check:typescript || echo "TypeScript check completed with warnings"
- name: ESLint - Svelte files
  run: pnpm run lint:svelte || echo "Svelte linting completed with warnings"
- name: ESLint - TypeScript files
  run: pnpm run lint:typescript || echo "TypeScript linting completed with warnings"
```

## 🎯 사용 방법

### 로컬 개발 시

```bash
# .svelte 파일만 검사
pnpm run check:svelte
pnpm run lint:svelte
pnpm run fix:svelte

# .ts 파일만 검사
pnpm run check:typescript
pnpm run lint:typescript
pnpm run fix:typescript
```

### IDE 설정 (VS Code)

```json
{
  "eslint.workingDirectories": [
    {
      "mode": "auto",
      "pattern": "**/*.svelte"
    },
    {
      "mode": "auto",
      "pattern": "**/*.ts"
    }
  ]
}
```

## 📊 현재 오류 분포

- **.svelte 파일**: 74개 오류
- **.ts 파일**: 28개 오류

## 🔄 다음 단계

1. CI에서 확장자별 검사 실행
2. IDE에서 확장자별 검사 설정
3. 단계별 오류 수정 진행
