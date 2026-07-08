/**
 * The hardware-detection bot (NOT AI — a plain string scanner).
 *
 * Given the project's code as text, it checks every pattern in
 * config/codePatterns.ts and reports:
 *   - which hardware boxes to auto-check (with "detected from code" badges)
 *   - fuzzy suggestions the poster can click to add (never auto-checked)
 *   - the "works on ESP32 too" footnote when both board families match
 *
 * Runs entirely in the browser inside the post form — no network, no AI.
 * To teach it new tricks, edit config/codePatterns.ts, not this file.
 */
import {
  analogReadHint,
  bothBoardsFootnote,
  codePatterns,
} from "@/config/codePatterns";

export type Detection = {
  /** Hardware ids to auto-check on the form. */
  detectedIds: string[];
  /** hardware id → the pattern labels that detected it (for the badge tooltip). */
  reasons: Record<string, string[]>;
  /** Suggest-only hints, shown as clickable chips under the code box. */
  suggestions: { label: string; hardwareIds: string[] }[];
  /** The "*works on ESP32 as well*" footnote, or null. */
  footnote: string | null;
};

export function detectHardware(code: string): Detection {
  const detectedIds: string[] = [];
  const reasons: Record<string, string[]> = {};
  const suggestions: { label: string; hardwareIds: string[] }[] = [];

  if (!code.trim()) {
    return { detectedIds, reasons, suggestions, footnote: null };
  }

  let esp32Matched = false;
  let arduinoMatched = false;

  for (const pattern of codePatterns) {
    const hit = pattern.match.some((needle) => code.includes(needle));
    if (!hit) continue;

    // Board patterns are handled after the loop (they interact).
    if (pattern.id === "board-esp32") { esp32Matched = true; continue; }
    if (pattern.id === "board-arduino") { arduinoMatched = true; continue; }

    if (pattern.suggestOnly) {
      suggestions.push({ label: pattern.label, hardwareIds: pattern.hardwareIds });
      continue;
    }

    for (const id of pattern.hardwareIds) {
      if (!detectedIds.includes(id)) detectedIds.push(id);
      (reasons[id] ??= []).push(pattern.label);
    }
  }

  // --- Board logic -----------------------------------------------------
  // ESP32 code almost always compiles for ESP32 only; Arduino.h alone means
  // classic Arduino. If BOTH match, we check Arduino as the safe baseline
  // and add the footnote that it likely runs on ESP32 as well.
  let footnote: string | null = null;
  if (esp32Matched && arduinoMatched) {
    detectedIds.push("arduino-uno-nano");
    (reasons["arduino-uno-nano"] ??= []).push("Arduino.h");
    footnote = bothBoardsFootnote;
  } else if (esp32Matched) {
    detectedIds.push("esp32");
    (reasons["esp32"] ??= []).push("WiFi.h / esp_ calls");
  } else if (arduinoMatched) {
    detectedIds.push("arduino-uno-nano");
    (reasons["arduino-uno-nano"] ??= []).push("Arduino.h");
  }

  // --- analogRead hint ---------------------------------------------------
  // Lots of analogRead() calls hints at knobs/joysticks — suggestion only.
  const analogCount = code.split("analogRead(").length - 1;
  if (analogCount >= analogReadHint.threshold) {
    suggestions.push({
      label: analogReadHint.label,
      hardwareIds: analogReadHint.hardwareIds,
    });
  }

  return { detectedIds, reasons, suggestions, footnote };
}
