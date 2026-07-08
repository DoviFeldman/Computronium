/**
 * ============================================================================
 * HARDWARE CONFIG — the master list of hardware parts
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   - The hardware checkboxes on the Post page (grouped by category,
 *     searchable). Posters tick what their project uses.
 *   - The hardware chips shown on every project card and post page.
 *   - The "hardware parts" multi-select filter on the main feed.
 *   - The parts list + buy links on each post's public page.
 *
 * WHO READS IT
 *   - app/post/page.tsx (the post form checkboxes)
 *   - components/PostCard.tsx (chips on cards)
 *   - app/p/[id]/page.tsx (parts list with buy links)
 *   - app/page.tsx (the parts filter)
 *   - config/codePatterns.ts refers to these `id`s (the detection bot maps
 *     code → hardware ids from THIS list)
 *
 * HOW TO ADD A PART
 *   Copy any line, give it a UNIQUE `id` (lowercase-with-dashes — once posts
 *   exist that use an id, don't change or delete that id, or old posts will
 *   show "unknown part"), a `name`, and one of the `category` values below.
 *   `buyLink`, `note`, and `price` are all optional. `price` (US dollars,
 *   rough) is only used to auto-suggest a total cost on the post form.
 *
 * HOW TO ADD A CATEGORY
 *   Add the string to the `hardwareCategories` array (order there = display
 *   order everywhere), then use it in items.
 * ============================================================================
 */

export type HardwareItem = {
  /** Unique, permanent id. Posts store this string — never rename in place. */
  id: string;
  /** Human-friendly name shown everywhere. Safe to reword anytime. */
  name: string;
  /** Must match one of `hardwareCategories` below. */
  category: string;
  /** Optional link to a store page (Amazon, AliExpress, wherever). */
  buyLink?: string;
  /** Optional one-liner shown next to the checkbox. */
  note?: string;
  /** Optional rough price in USD — used to auto-suggest a project total. */
  price?: number;
};

/** Display order of categories on the post form and post pages. */
export const hardwareCategories = [
  "Boards",
  "Displays & Indicators",
  "Motors & Movement",
  "Power",
  "Input & Control",
  "Switching & Output",
  "Connectivity & Storage",
  "Sensors",
  "Essentials",
] as const;

export const hardware: HardwareItem[] = [
  // ------------------------------------------------------------- Boards ---
  { id: "esp32", name: "ESP32 dev board", category: "Boards", price: 6, note: "WiFi + Bluetooth, 3.3V logic" },
  { id: "arduino-uno-nano", name: "Arduino Uno / Nano", category: "Boards", price: 5, note: "5V logic, the classic beginner board" },
  { id: "pi-pico", name: "Raspberry Pi Pico", category: "Boards", price: 4, note: "3.3V logic, runs MicroPython or C" },

  // ----------------------------------------------- Displays & Indicators ---
  { id: "oled-096-ssd1306", name: '0.96" OLED (SSD1306, I2C)', category: "Displays & Indicators", price: 3 },
  { id: "lcd-1602-i2c", name: "16x2 LCD with I2C backpack", category: "Displays & Indicators", price: 3 },
  { id: "ws2812b-strip", name: "WS2812B / NeoPixel LED strip", category: "Displays & Indicators", price: 8, note: "individually addressable RGB LEDs" },
  { id: "tm1637-7seg", name: "7-segment module (TM1637)", category: "Displays & Indicators", price: 2 },
  { id: "max7219-matrix", name: "8x8 LED matrix (MAX7219)", category: "Displays & Indicators", price: 3 },
  { id: "leds-resistors", name: "Standard LEDs + resistors", category: "Displays & Indicators", price: 2 },

  // ---------------------------------------------------- Motors & Movement ---
  { id: "sg90-servo", name: "SG90 / MG90S micro servo", category: "Motors & Movement", price: 3, note: "plugs straight into a board pin (signal) + 5V" },
  { id: "stepper-28byj48-uln2003", name: "28BYJ-48 stepper + ULN2003 driver", category: "Motors & Movement", price: 3, note: "slow but precise; driver board included" },
  { id: "tt-gear-motor", name: "DC gear (TT) motors", category: "Motors & Movement", price: 2, note: "the yellow robot-car motors" },
  { id: "l298n-drv8833", name: "L298N or DRV8833 motor driver", category: "Motors & Movement", price: 3, note: "needed to drive DC motors — see /learn" },
  { id: "a4988-tmc2208", name: "A4988 / TMC2208 stepper driver", category: "Motors & Movement", price: 3, note: "for NEMA-style steppers; TMC2208 is the quiet one" },
  { id: "vibration-motor", name: "Vibration motor module", category: "Motors & Movement", price: 2 },

  // ---------------------------------------------------------------- Power ---
  { id: "mb102-psu", name: "MB102 breadboard power supply", category: "Power", price: 2 },
  { id: "18650-holder", name: "18650 holder + cells", category: "Power", price: 6 },
  { id: "tp4056", name: "TP4056 charging module", category: "Power", price: 1, note: "charges one lithium cell safely over USB" },
  { id: "lm2596-buck", name: "LM2596 buck converter", category: "Power", price: 2, note: "steps voltage DOWN (e.g. 12V → 5V)" },
  { id: "mt3608-boost", name: "MT3608 boost converter", category: "Power", price: 1, note: "steps voltage UP (e.g. 3.7V → 5V)" },
  { id: "ams1117-33", name: "AMS1117 3.3V regulator", category: "Power", price: 1 },

  // ------------------------------------------------------ Input & Control ---
  { id: "push-buttons", name: "Tactile push buttons", category: "Input & Control", price: 1 },
  { id: "ky040-encoder", name: "KY-040 rotary encoder", category: "Input & Control", price: 2 },
  { id: "potentiometer-10k", name: "10k potentiometers", category: "Input & Control", price: 1 },
  { id: "keypad-4x4", name: "4x4 membrane keypad", category: "Input & Control", price: 2 },
  { id: "joystick-module", name: "Joystick module", category: "Input & Control", price: 2 },
  { id: "ir-remote-kit", name: "IR remote + receiver kit", category: "Input & Control", price: 2 },

  // ---------------------------------------------------- Switching & Output ---
  { id: "relay-module", name: "Relay module (1/2/4 channel)", category: "Switching & Output", price: 3, note: "lets a board switch mains/high-power things — be careful with mains!" },
  { id: "irf520-mosfet", name: "IRF520 MOSFET module", category: "Switching & Output", price: 2 },
  { id: "buzzer", name: "Passive / active buzzer", category: "Switching & Output", price: 1 },
  { id: "ssr-relay", name: "Solid state relay", category: "Switching & Output", price: 4 },

  // ----------------------------------------------- Connectivity & Storage ---
  { id: "microsd-module", name: "MicroSD reader module", category: "Connectivity & Storage", price: 2 },
  { id: "logic-level-shifter", name: "Logic level shifter (3.3V ↔ 5V)", category: "Connectivity & Storage", price: 1, note: "see /learn: '3.3V vs 5V'" },

  // -------------------------------------------------------------- Sensors ---
  { id: "hc-sr04", name: "HC-SR04 ultrasonic distance sensor", category: "Sensors", price: 2 },
  { id: "pir-motion", name: "PIR motion sensor", category: "Sensors", price: 2 },
  { id: "dht22", name: "DHT22 temperature/humidity sensor", category: "Sensors", price: 4 },
  { id: "mpu6050", name: "MPU6050 IMU (gyro + accelerometer)", category: "Sensors", price: 3 },
  { id: "photoresistor", name: "Photoresistor (LDR)", category: "Sensors", price: 1 },
  { id: "soil-moisture", name: "Soil moisture sensor", category: "Sensors", price: 2 },
  { id: "ir-obstacle", name: "IR obstacle sensor", category: "Sensors", price: 1 },
  { id: "hall-effect", name: "Hall effect sensor", category: "Sensors", price: 1 },

  // ----------------------------------------------------------- Essentials ---
  { id: "breadboard", name: "Breadboards", category: "Essentials", price: 3 },
  { id: "jumper-wires", name: "Jumper wires", category: "Essentials", price: 3 },
  { id: "resistor-kit", name: "Resistor kit", category: "Essentials", price: 5 },
  { id: "capacitor-kit", name: "Capacitor kit", category: "Essentials", price: 5 },
];

/** Quick lookup: hardware id → item. Used all over the app. */
export const hardwareById: Record<string, HardwareItem> = Object.fromEntries(
  hardware.map((h) => [h.id, h])
);
