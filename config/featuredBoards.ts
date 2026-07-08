/**
 * ============================================================================
 * FEATURED BOARDS — the quick-filter row at the top of the main feed
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   The row of big board buttons across the top of the main page ("ESP32",
 *   "Arduino", …). Clicking one filters the feed to projects that use that
 *   board.
 *
 * WHO READS IT
 *   - app/page.tsx / components/Feed.tsx (renders the row)
 *
 * HOW TO EDIT
 *   Each entry points at a hardware id from config/hardware.ts. To feature
 *   the Raspberry Pi Pico, for example, add:
 *     { hardwareId: "pi-pico", label: "Pi Pico", emoji: "🍓" },
 * ============================================================================
 */

export type FeaturedBoard = {
  /** Must be an id from config/hardware.ts (category: Boards). */
  hardwareId: string;
  /** Text on the button. */
  label: string;
  /** Emoji on the button. */
  emoji: string;
};

export const featuredBoards: FeaturedBoard[] = [
  { hardwareId: "esp32", label: "ESP32", emoji: "📡" },
  { hardwareId: "arduino-uno-nano", label: "Arduino", emoji: "🔌" },
];
