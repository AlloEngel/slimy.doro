/** Base window width when the to-do drawer is closed (or hidden entirely). */
export const BASE_WINDOW_WIDTH = 400;
/** Width of the compact to-do strip (matches TodoCompact's fixed width). */
export const TODO_COMPACT_WIDTH = 132;
/** Extra width the window grows by while the full task drawer is open. */
export const DRAWER_EXTRA_WIDTH = 240;
/** Total window width while the drawer is open. */
export const EXPANDED_WINDOW_WIDTH = BASE_WINDOW_WIDTH + DRAWER_EXTRA_WIDTH;
/** On-screen width of the expanded drawer panel itself (replaces the compact strip). */
export const TODO_EXPANDED_WIDTH = TODO_COMPACT_WIDTH + DRAWER_EXTRA_WIDTH;
