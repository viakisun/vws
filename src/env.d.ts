/// <reference types="@sveltejs/kit" />

// SvelteKit 환경 변수 모듈 타입 선언
declare module '$env/dynamic/private' {
  export const env: Record<string, string | undefined>
}

declare module '$env/dynamic/public' {
  export const env: Record<string, string | undefined>
}

declare module '$env/static/private' {
  export const env: Record<string, string | undefined>
}

declare module '$env/static/public' {
  export const env: Record<string, string | undefined>
}
