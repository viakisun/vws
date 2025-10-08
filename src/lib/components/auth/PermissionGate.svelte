<script lang="ts">
  import { can, type RoleCode } from '$lib/stores/permissions';

  // Props
  interface Props {
    resource?: string;
    action?: 'read' | 'write' | 'delete' | 'approve';
    scope?: 'own' | 'department' | 'all';
    role?: RoleCode;
    roles?: RoleCode[];
    requireAll?: boolean;
    fallback?: 'hide' | 'disable' | 'message' | 'custom';
    message?: string;
    children?: any;
  }

  let {
    resource = undefined,
    action = 'read',
    scope = undefined,
    role = undefined,
    roles = undefined,
    requireAll = false,
    fallback = 'hide',
    message = '이 콘텐츠에 대한 권한이 없습니다.',
    children
  }: Props = $props();

  // 권한 체크 로직
  const hasPermission = $derived((() => {
    const conditions: boolean[] = [];

    // 리소스 권한 체크
    if (resource) {
      let hasResourcePermission = false;
      switch (action) {
        case 'read':
          hasResourcePermission = $can.read(resource, scope);
          break;
        case 'write':
          hasResourcePermission = $can.write(resource, scope);
          break;
        case 'delete':
          hasResourcePermission = $can.delete(resource, scope);
          break;
        case 'approve':
          hasResourcePermission = $can.approve(resource, scope);
          break;
      }
      conditions.push(hasResourcePermission);
    }

    // 단일 역할 체크
    if (role) {
      conditions.push($can.hasRole(role));
    }

    // 복수 역할 체크
    if (roles && roles.length > 0) {
      conditions.push($can.hasAnyRole(roles));
    }

    // 조건이 없으면 기본적으로 true
    if (conditions.length === 0) {
      return true;
    }

    // requireAll이 true면 모든 조건 만족, false면 하나라도 만족
    return requireAll ? conditions.every(Boolean) : conditions.some(Boolean);
  })());
</script>

{#if hasPermission}
  {@render children?.()}
{:else if fallback === 'message'}
  <div class="alert alert-warning">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      class="h-6 w-6 shrink-0 stroke-current"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <span>{message}</span>
  </div>
{:else if fallback === 'disable'}
  <div class="opacity-50 pointer-events-none">
    {@render children?.()}
  </div>
{:else if fallback === 'custom'}
  <div class="text-gray-500">권한이 없습니다.</div>
{/if}