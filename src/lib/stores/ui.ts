import { writable } from "svelte/store";

export const sidebarOpen = writable<boolean>(true);
export const notifications = writable<
  Array<{ id: string; type: "success" | "error" | "info"; message: string }>
>([]);
