/**
 * ============================================================================
 * CODE PATTERNS — the hardware-detection bot's lookup table (NOT AI!)
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   When someone adds code on the Post page (paste, file, or zip), the site
 *   scans the code text for the substrings below. Every pattern that matches
 *   auto-checks its hardware boxes (with a little "detected from code" badge
 *   the poster can un-tick). It's a dumb-but-honest string search — no AI,
 *   no API calls, runs entirely in the browser.
 *
 * WHO READS IT
 *   - lib/detectHardware.ts (the scanner)
 *   - app/post/page.tsx (runs the scanner whenever code changes)
 *
 * HOW EACH PATTERN WORKS
 *   - `match`: list of substrings. If ANY of them appears in the code,
 *     the pattern fires. Matching is case-sensitive on purpose —
 *     `#include <Servo.h>` is always written exactly like that.
 *   - `hardwareIds`: which checkboxes to tick. These MUST be ids from
 *     config/hardware.ts, or the match is silently ignored.
 *   - `suggestOnly: true`: don't auto-check — just show it as a suggestion
 *     the poster can click to add. Use this for fuzzy hints.
 *   - `label`: what the badge/suggestion says the bot saw.
 *
 * SPECIAL CASES (handled in lib/detectHardware.ts, tune the values here)
 *   - If BOTH an ESP32 pattern and an Arduino pattern match, the form shows
 *     the footnote below instead of checking both boards.
 *   - If `analogRead(` appears at least `analogReadThreshold` times, the
 *     analog-inputs suggestion fires (pots/joysticks are a guess, not a
 *     certainty — that's why it's suggest-only).
 *
 * HOW TO ADD A PATTERN
 *   Copy a line, change the substrings and the hardware ids. Done.
 * ============================================================================
 */

export type CodePattern = {
  /** Unique id for this rule (only used internally / for React keys). */
  id: string;
  /** What the bot tells the poster it found, e.g. `Servo.h`. */
  label: string;
  /** Substrings to look for in the code. Any one of them counts as a match. */
  match: string[];
  /** Hardware ids (from config/hardware.ts) to check when matched. */
  hardwareIds: string[];
  /** If true: show as a clickable suggestion instead of auto-checking. */
  suggestOnly?: boolean;
};

export const codePatterns: CodePattern[] = [
  // --- Motors ---------------------------------------------------------------
  {
    id: "servo",
    label: "Servo library (Servo.h / ESP32Servo.h)",
    match: ["#include <Servo.h>", "#include <ESP32Servo.h>", "ESP32Servo.h", "Servo.h"],
    hardwareIds: ["sg90-servo"],
  },
  {
    id: "stepper",
    label: "Stepper library (AccelStepper / Stepper.h)",
    match: ["AccelStepper", "Stepper.h"],
    hardwareIds: ["stepper-28byj48-uln2003", "a4988-tmc2208"],
  },

  // --- LEDs & displays -------------------------------------------------------
  {
    id: "neopixel",
    label: "Addressable LED library (Adafruit_NeoPixel / FastLED)",
    match: ["Adafruit_NeoPixel", "FastLED"],
    hardwareIds: ["ws2812b-strip"],
  },
  {
    id: "oled",
    label: "OLED library (Adafruit_SSD1306 / U8g2)",
    match: ["Adafruit_SSD1306", "U8g2", "u8g2"],
    hardwareIds: ["oled-096-ssd1306"],
  },
  {
    id: "lcd",
    label: "LCD library (LiquidCrystal_I2C)",
    match: ["LiquidCrystal_I2C"],
    hardwareIds: ["lcd-1602-i2c"],
  },
  {
    id: "7seg",
    label: "TM1637 7-segment library",
    match: ["TM1637"],
    hardwareIds: ["tm1637-7seg"],
  },
  {
    id: "ledmatrix",
    label: "MAX7219 / LedControl matrix library",
    match: ["MAX7219", "LedControl"],
    hardwareIds: ["max7219-matrix"],
  },

  // --- Boards -----------------------------------------------------------------
  // Board detection gets special treatment in lib/detectHardware.ts:
  // if both fire, only ESP32 is checked and the footnote below is shown.
  {
    id: "board-esp32",
    label: "ESP32 code (WiFi.h / esp_ calls)",
    match: ["WiFi.h", "esp_", "ESP32"],
    hardwareIds: ["esp32"],
  },
  {
    id: "board-arduino",
    label: "Arduino code (Arduino.h)",
    match: ["Arduino.h"],
    hardwareIds: ["arduino-uno-nano"],
  },

  // --- Modules & sensors -------------------------------------------------------
  {
    id: "ir",
    label: "IR remote library (IRremote)",
    match: ["IRremote"],
    hardwareIds: ["ir-remote-kit"],
  },
  {
    id: "sd",
    label: "SD card library (SD.h)",
    match: ["SD.h", "SdFat"],
    hardwareIds: ["microsd-module"],
  },
  {
    id: "dht",
    label: "DHT sensor library",
    match: ["DHT.h", "DHT22", "DHTesp"],
    hardwareIds: ["dht22"],
  },
  {
    id: "mpu",
    label: "MPU6050 IMU library",
    match: ["MPU6050", "Adafruit_MPU6050"],
    hardwareIds: ["mpu6050"],
  },
  {
    id: "ultrasonic",
    label: "Ultrasonic library (NewPing)",
    match: ["NewPing"],
    hardwareIds: ["hc-sr04"],
  },
];

/**
 * Fuzzy hint: lots of `analogRead(` calls usually means knobs or a joystick.
 * This is only a SUGGESTION (never auto-checked) because analogRead could
 * also be reading a light sensor, a battery divider, etc.
 */
export const analogReadHint = {
  /** How many analogRead( calls before the hint appears. */
  threshold: 3,
  label: "Several analogRead() calls — maybe a potentiometer or joystick?",
  hardwareIds: ["potentiometer-10k", "joystick-module"],
};

/** Shown when the code matches BOTH ESP32 and Arduino patterns. */
export const bothBoardsFootnote =
  "*The code suggests this works on ESP32 as well.*";
