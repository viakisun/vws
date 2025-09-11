<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { personnelStore } from '$lib/stores/personnel';
  import { projectsStore } from '$lib/stores/rnd';
  import type { Personnel } from '$lib/types';

  $: people = $personnelStore as Personnel[];
  $: projects = $projectsStore;

  function getAlloc(person: Personnel, projectId: string): number {
    const p = person.participations.find((pp) => pp.projectId === projectId);
    return p ? p.allocationPct : 0;
  }

  function totalAlloc(person: Personnel): number {
    return person.participations.reduce((s, pp) => s + pp.allocationPct, 0);
  }

  function overlaps(aStart?: string, aEnd?: string, bStart?: string, bEnd?: string): boolean {
    if (!aStart || !bStart) return false;
    const as = new Date(aStart).getTime();
    const bs = new Date(bStart).getTime();
    const ae = aEnd ? new Date(aEnd).getTime() : Number.MAX_SAFE_INTEGER;
    const be = bEnd ? new Date(bEnd).getTime() : Number.MAX_SAFE_INTEGER;
    return as <= be && bs <= ae;
  }

  function hasConflict(person: Personnel): boolean {
    const parts = person.participations;
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        if (overlaps(parts[i].startDate, parts[i].endDate, parts[j].startDate, parts[j].endDate)) {
          if (parts[i].allocationPct + parts[j].allocationPct > 100) return true;
        }
      }
    }
    return totalAlloc(person) > 100;
  }
</script>

<h2 class="text-lg font-semibold mb-3">Participation Rate Management</h2>

<Card>
  <div class="overflow-auto">
    <table class="min-w-full text-sm">
      <thead class="bg-gray-50 text-left text-gray-600">
        <tr>
          <th class="px-3 py-2">인력</th>
          {#each projects as prj}
            <th class="px-3 py-2 whitespace-nowrap">{prj.id}</th>
          {/each}
          <th class="px-3 py-2">합계</th>
          <th class="px-3 py-2">충돌</th>
          <th class="px-3 py-2">상태</th>
        </tr>
      </thead>
      <tbody class="divide-y">
        {#each people as person}
          <tr>
            <td class="px-3 py-2 whitespace-nowrap">{person.name} <span class="text-caption">({person.id})</span></td>
            {#each projects as prj}
              <td class="px-3 py-2 text-right tabular-nums">{getAlloc(person, prj.id)}%</td>
            {/each}
            <td class="px-3 py-2 text-right font-semibold tabular-nums">{totalAlloc(person)}%</td>
            <td class="px-3 py-2">
              {#if hasConflict(person)}
                <Badge color="red">충돌</Badge>
              {:else}
                <Badge color="green">정상</Badge>
              {/if}
            </td>
            <td class="px-3 py-2">
              {#if totalAlloc(person) > 100}
                <Badge color="red">과할당</Badge>
              {:else if totalAlloc(person) === 100}
                <Badge color="green">정상</Badge>
              {:else}
                <Badge color="yellow">여유 {100 - totalAlloc(person)}%</Badge>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</Card>

