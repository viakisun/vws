<script lang="ts">
  import ThemeCard from './ThemeCard.svelte'
  import ThemeBadge from './ThemeBadge.svelte'

  interface Props {
    title: string
    value: string
    badge?: string
    icon?: any
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink'
    href?: string
    class?: string
  }

  let {
    title,
    value,
    badge = '',
    icon,
    color = 'blue',
    href,
    class: className = '',
    ...restProps
  }: Props = $props()

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      dark: { bg: 'bg-blue-900/20', text: 'text-blue-400' }
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      dark: { bg: 'bg-green-900/20', text: 'text-green-400' }
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      dark: { bg: 'bg-purple-900/20', text: 'text-purple-400' }
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      dark: { bg: 'bg-orange-900/20', text: 'text-orange-400' }
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      dark: { bg: 'bg-red-900/20', text: 'text-red-400' }
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      dark: { bg: 'bg-yellow-900/20', text: 'text-yellow-400' }
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      dark: { bg: 'bg-indigo-900/20', text: 'text-indigo-400' }
    },
    pink: {
      bg: 'bg-pink-100',
      text: 'text-pink-600',
      dark: { bg: 'bg-pink-900/20', text: 'text-pink-400' }
    }
  }
</script>

<ThemeCard
  variant="elevated"
  hover={true}
  clickable={true}
  class="group cursor-pointer {className}"
  {...restProps}
>
  {#if href}
    <a
      {href}
      class="block">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium"
            style:color="var(--color-text-secondary)">{title}</p>
          <p
            class="text-2xl font-bold mt-1"
            style:color="var(--color-text)">{value}</p>
          {#if badge}
            <div class="mt-2">
              <ThemeBadge
                variant="default"
                size="sm">{badge}</ThemeBadge>
            </div>
          {/if}
        </div>
        {#if icon}
          {@const IconComponent = icon}
          <div
            class="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 {colorClasses[
              color
            ].bg} dark:{colorClasses[color].dark.bg}"
          >
            <IconComponent class="h-6 w-6 {colorClasses[color].text} dark:{colorClasses[color].dark.text}"
            />
          </div>
        {:else}
          <!-- 아이콘이 없을 때 대체 아이콘 -->
          <div class="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 bg-gray-100 dark:bg-gray-800"
          >
            <div class="h-6 w-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
          </div>
        {/if}
      </div>
    </a>
  {:else}
    <div class="flex items-center justify-between">
      <div class="flex-1 min-w-0">
        <p
          class="text-sm font-medium"
          style:color="var(--color-text-secondary)">{title}</p>
        <p
          class="text-2xl font-bold mt-1"
          style:color="var(--color-text)">{value}</p>
        {#if badge}
          <div class="mt-2">
            <ThemeBadge
              variant="default"
              size="sm">{badge}</ThemeBadge>
          </div>
        {/if}
      </div>
      {#if icon}
        {@const IconComponent = icon}
        <div
          class="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 {colorClasses[
            color
          ].bg} dark:{colorClasses[color].dark.bg}"
        >
          <IconComponent class="h-6 w-6 {colorClasses[color].text} dark:{colorClasses[color].dark.text}"
          />
        </div>
      {:else}
        <!-- 아이콘이 없을 때 대체 아이콘 -->
        <div class="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 bg-gray-100 dark:bg-gray-800"
        >
          <div class="h-6 w-6 bg-gray-400 dark:bg-gray-500 rounded"></div>
        </div>
      {/if}
    </div>
  {/if}
</ThemeCard>
