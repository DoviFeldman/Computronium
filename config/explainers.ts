/**
 * ============================================================================
 * EXPLAINERS — everything on the /learn page
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   The entire Explainer / Information page (/learn). Every entry below
 *   becomes one expandable article. No database involved — edit this file,
 *   redeploy, done.
 *
 * WHO READS IT
 *   - app/learn/page.tsx (renders this array top to bottom)
 *
 * THE STRUCTURE (every entry has exactly these parts)
 *   - title                — the headline
 *   - whyItIsThisWay       — the honest physical/engineering reason things
 *                            are the way they are
 *   - alternatives         — what alternatives exist
 *   - alternativeShortfalls— why those alternatives fall short
 *   - baseAdvantages       — why the standard option is better than people think
 *   - bottomLine (optional)— one-sentence takeaway
 *
 * TONE GUIDE (for when you write new ones)
 *   Honest, plain-language, kid-readable. "This is the current state of the
 *   hardware, why it's physically like this, and what we have to work with."
 *   No marketing, no hand-waving.
 *
 * HOW TO ADD ONE
 *   Copy any entry, change the text. Order in this array = order on the page.
 * ============================================================================
 */

export type Explainer = {
  title: string;
  whyItIsThisWay: string;
  alternatives: string;
  alternativeShortfalls: string;
  baseAdvantages: string;
  bottomLine?: string;
};

export const explainers: Explainer[] = [
  {
    title: "Why you can't run a motor straight from an ESP32 or Arduino pin",
    whyItIsThisWay:
      "A microcontroller pin is a signal wire, not a power wire. It can safely supply about 20–40 milliamps — enough to light one LED. Even a tiny hobby motor gulps 200–1000+ milliamps, and the moment it starts spinning it briefly demands several times that. Ask a pin for that much current and the tiny transistor behind it overheats and dies, sometimes taking the whole chip with it. On top of that, motors kick voltage spikes back into the wire when they stop (it's called back-EMF), which pins are not built to survive.",
    alternatives:
      "Motor driver boards (L298N, DRV8833), MOSFET modules (IRF520), relay modules, or motors with drivers built in (servos, and the 28BYJ-48 stepper that ships with its ULN2003 driver board).",
    alternativeShortfalls:
      "There's no real 'alternative' to using a driver — anything that skips it is just a slower way to kill your board. Some people try transistors from a parts bin, which works but is easy to wire wrong. Relays technically switch a motor on and off but can't control speed or direction smoothly.",
    baseAdvantages:
      "Driver boards cost $2–3, wire up with four or five jumpers, and exist precisely so your $6 brain-board only ever handles brain-signals. The pin says 'spin at 60%', the driver does the heavy lifting from the battery. This split — logic here, power there — is how every real robot is built, from toys to factory arms.",
    bottomLine:
      "Pins whisper instructions; drivers do the lifting. A $3 driver protects a $6 board — always use one.",
  },
  {
    title: "Servos vs steppers vs BLDC motors — which motor do I actually need?",
    whyItIsThisWay:
      "There are three families of hobby motor, and they differ in what electronics they need before they'll even move. Hobby servos (SG90/MG90S) have the driver AND position sensor built into the case — you plug them into power plus one signal pin and they just go to the angle you ask for. Steppers move in fixed tiny steps, but their coils must be energized in a precise pattern, so they need a driver board (A4988 or TMC2208 for NEMA steppers; the little 28BYJ-48 comes with its ULN2003 driver). BLDC motors — drone motors — are just three coils and magnets with zero smarts, so they need an ESC (electronic speed controller) to spin fast, or an expensive FOC controller with an encoder to move slowly and precisely.",
    alternatives:
      "Plain DC gear motors (the yellow TT motors) with an L298N/DRV8833 driver are a fourth option when you just need wheels to turn and don't care about exact position.",
    alternativeShortfalls:
      "DC gear motors have no idea where they are — fine for a rover, useless for a robot arm joint that must hold an angle. Servos are easy but most rotate only ~180° and the cheap ones are weak and jittery. Steppers hold position beautifully but are heavy, power-hungry even when still, and 'skip' silently if overloaded. BLDCs are power-dense marvels that are useless below full speed without expensive extra electronics.",
    baseAdvantages:
      "For 90% of beginner robots, the boring answer is the right one: servos for joints that need angles, steppers for slow precise motion (3D printers are full of them), DC gear motors for wheels. All three paths cost under $5 per motor and have mountains of example code.",
    bottomLine:
      "Servo = plug in and go. Stepper = needs a driver. BLDC = needs an ESC (fast) or a pricey FOC controller (slow/precise). Pick the motor by what it needs to move, not by what looks coolest.",
  },
  {
    title: "Why a $15 drone motor cannot power your robot arm",
    whyItIsThisWay:
      "This one breaks a lot of hearts, so let's be crystal clear. A drone motor (a small BLDC) makes big power numbers by spinning insanely fast — 10,000+ RPM — with almost no torque at low speed. A robot arm needs the exact opposite: slow, controlled movement and the strength to HOLD a position against gravity, even while standing still. A bare BLDC physically cannot do that: it has no idea where its own shaft is pointing. To make one hold an angle you must add a position encoder plus an FOC (field-oriented control) driver that measures and re-steers the magnetic field thousands of times per second. Decent FOC controller + encoder setups cost more than the whole rest of a hobby arm — usually $30–100+ per joint. So the $15 price tag on the motor is real, but it buys you a fan, not a joint.",
    alternatives:
      "Gearing the BLDC way down (like commercial robot actuators do), hobby servos, geared steppers, or 'smart servo' modules (serial-bus servos) that bundle motor + gears + encoder + controller in one box.",
    alternativeShortfalls:
      "Gearboxes good enough to tame a BLDC (planetary/cycloidal) are precision parts — hard to 3D print well and not cheap to buy. And you STILL need the FOC controller. Smart servos solve everything but cost $15–40 each, which adds up fast on a six-joint arm.",
    baseAdvantages:
      "The humble hobby servo and the geared stepper already contain the whole solution — motor, gears, and position control — for a few dollars. They're weaker and slower than a FOC'd BLDC, but they hold position, speak a dead-simple protocol, and won't strand your project waiting on an $80 controller board.",
    bottomLine:
      "Cheap + fast (drone motor) is not the same product as cheap + slow + strong. Precision at low speed is exactly the part that costs money.",
  },
  {
    title: "3.3V vs 5V — the silent board killer",
    whyItIsThisWay:
      "Chips are built from transistors with a maximum voltage they can tolerate, set by how physically small their internals are. Older/simpler chips (classic Arduino, many sensor modules) run at 5V. Modern, faster, more efficient chips (ESP32, Raspberry Pi, Pi Pico) are made with finer transistors that run at 3.3V — and feeding 5V into a 3.3V input pin over-stresses it. The cruel part: it often doesn't die instantly. It works for a demo, degrades quietly, and fails weeks later in a way that looks like YOUR code's fault.",
    alternatives:
      "Logic level shifter modules (~$1) translate signals both directions. For one-direction signals INTO a 3.3V board, a simple two-resistor voltage divider works. Many modules also come in 3.3V-native versions if you check before buying.",
    alternativeShortfalls:
      "Resistor dividers get flaky at high speeds (fast data lines like NeoPixel signals) and only work one way. 'It worked without a shifter for me' is survivorship bias — some pins tolerate abuse for a while, and the internet is full of lucky people giving unlucky advice.",
    baseAdvantages:
      "The rule itself is simple and learnable in one sitting: check every wire that carries a SIGNAL between parts, and if one side is 5V and the other is 3.3V, put a $1 shifter in between. Power pins are separate — a 3.3V board fed through its 5V/VIN pin is fine because it has an onboard regulator; it's the signal pins that are fragile.",
    bottomLine:
      "Before connecting any two boards, ask one question: what voltage does each side's SIGNAL pin expect? If they differ, spend the $1.",
  },
  {
    title: "ESP32 vs Arduino vs Raspberry Pi — what each one is actually for",
    whyItIsThisWay:
      "These three get lumped together, but they're different species. An Arduino Uno/Nano is a microcontroller: one small chip running your code and nothing else, instantly, forever, at 5V — great at reliably wiggling pins. An ESP32 is also a microcontroller but modern: much faster, way more memory, WiFi and Bluetooth built in, at 3.3V, for about the same price. A Raspberry Pi (the big one, not the Pico) is a full computer: it boots Linux from an SD card, runs Python and cameras and web browsers — and accordingly needs seconds to boot, real power, and a proper shutdown. The Pi Pico, despite the name, is in the microcontroller family, not the computer family.",
    alternatives:
      "Pi Pico (W) as a cheaper microcontroller with optional WiFi; old phones as project computers; ESP8266 as the ESP32's cheaper little sibling; countless Arduino clones.",
    alternativeShortfalls:
      "Using a Raspberry Pi where a microcontroller belongs gives you SD-card corruption when power cuts, 30-second boots, and overkill power draw for blinking an LED. Using an Arduino where you need WiFi means bolting on shields that cost more than an entire ESP32. The classic Uno's 2KB of RAM runs out shockingly fast.",
    baseAdvantages:
      "Match the tool to the job and everything gets easy. Needs WiFi or decent horsepower? ESP32 — it's the default answer for most projects on this site. Dead-simple 5V project or following an older tutorial exactly? Arduino, with its unbeatable beginner ecosystem. Needs a camera, real AI, or a screen with a desktop? That's Raspberry Pi territory.",
    bottomLine:
      "Arduino = simple 5V classic. ESP32 = modern default with WiFi. Raspberry Pi = an actual computer — only reach for it when you truly need one.",
  },
  {
    title: "How to power an ESP32 — USB, 5V pin, battery, or solar",
    whyItIsThisWay:
      "The ESP32 chip itself runs on 3.3V, but a dev board carries a small regulator that turns anything from ~4.5–5.5V into clean 3.3V. That gives you two safe doorways in: the USB port (which is just 5V with a connector on it) and the 5V/VIN pin. What makes powering it interesting is WiFi: the chip idles around 40mA but SPIKES to ~400mA+ for split seconds when transmitting. Weak supplies that can't serve those spikes cause the most maddening bug in hobby electronics — random reboots that look exactly like a software crash.",
    alternatives:
      "USB from a wall charger or power bank (easiest). A 3.7V lithium cell (18650 or pouch) through a TP4056 charger module plus an MT3608 boost converter up to 5V. A small solar panel charging that same battery through the TP4056. Plain AA packs through a buck/boost converter.",
    alternativeShortfalls:
      "Bare battery straight to the 3.3V pin bypasses the regulator and the protection — a full lithium cell is 4.2V and can cook the chip. Solar without a battery browns out on every cloud. Cheap power banks auto-shut off when the ESP32 sleeps, because they think nothing's plugged in. And 9V smoke-detector batteries are a trap: tiny capacity, wrong voltage, avoid.",
    baseAdvantages:
      "The boring path is genuinely great: a $2 USB wall charger delivers stable 5V with all the spike headroom you need, forever. For portable builds, the TP4056 + 18650 + boost combo costs about $8 total, is safely rechargeable, and is the de-facto standard — every problem you could hit has already been answered online.",
    bottomLine:
      "Plugged-in project: USB and done. Portable: 18650 + TP4056 + boost to the 5V pin. Never feed a raw battery into the 3.3V pin.",
  },
  {
    title: "Alternatives to soldering — how far can you get without an iron?",
    whyItIsThisWay:
      "A solder joint does two jobs at once: it's an electrical connection AND a mechanical one, gas-tight so it can't oxidize or wiggle loose. That's why it's the standard — and also why it needs a hot iron and a bit of skill. But hobby electronics evolved a whole ecosystem for iron-free building, because breadboards and jumpers make experimenting faster even for people who CAN solder.",
    alternatives:
      "Breadboards (push parts into sprung holes), Dupont jumper wires (most modules ship with pin headers that accept them), screw terminals and terminal-block shields (clamp bare wire with a screwdriver), Wago-style lever connectors for power wiring, alligator clips for quick tests, and crimped connectors.",
    alternativeShortfalls:
      "Every solderless connection is a spring pressing on metal, and springs lose. Breadboard contacts wear out, jumpers half-fall-out invisibly, and any vibration — which is to say, any robot that MOVES — will eventually shake something loose, causing ghost bugs that vanish when you touch the wires. Breadboards also add noise and can't carry motor-level current. And some parts (bare LED strips, battery tabs) simply arrive without any connector to grab.",
    baseAdvantages:
      "For learning, prototyping, and desk-bound projects, breadboard + jumpers is honestly the RIGHT tool, not a compromise — you can rebuild a circuit in minutes. The happy medium for moving robots is screw terminals: solderless, but clamped tight. And when you do eventually get an iron: $15 buys a fine one, and the skill takes an afternoon of practice, not a semester.",
    bottomLine:
      "Breadboards for experimenting, screw terminals for robots that move, solder when it has to survive. You can genuinely build your first five projects without ever heating an iron.",
  },
  {
    title: "Cheap + precise + strong: pick two — the golden rule of hobby motors",
    whyItIsThisWay:
      "Precision and strength each cost real physical stuff. Strength (torque) takes copper, magnets, and gears — raw materials, so raw cost. Precision takes a sensor that knows where the shaft is (encoder) plus electronics smart enough to act on it thousands of times a second. A motor that is strong AND precise therefore contains: big motor + good gearbox + encoder + controller. That stack is why one joint of an industrial robot arm costs more than a laptop. Hobby parts don't cheat this rule — they just choose which corner to give up.",
    alternatives:
      "Cheap + precise, weak: hobby servos and small steppers — perfect for grippers, camera mounts, dials. Cheap + strong, imprecise: DC gear motors and drill motors — perfect for wheels and spinning things. Precise + strong, expensive: smart serial-bus servos ($15–40/joint), FOC'd BLDCs with encoders, harmonic-drive actuators ($$$).",
    alternativeShortfalls:
      "Trying to dodge the triangle is the classic beginner money-pit: 3D-printed gearboxes on cheap motors wear out and add slop right where you wanted precision; 'I'll just use a bigger servo' hits a wall because giant hobby servos get expensive AND stay imprecise; salvaged motors have no datasheets, no mounts, and no encoders.",
    baseAdvantages:
      "Working WITH the triangle is liberating: design your robot so each joint only needs two of the three. Wheels don't need precision — gear motors, done. A gripper doesn't need strength — $3 servo, done. Save the expensive corner for the one joint that truly needs all three, or redesign so none does. That's not settling; it's exactly what good engineers do.",
    bottomLine:
      "Cheap, precise, strong — every motor on Earth picks two. Design around the triangle instead of fighting it, and your robot gets cheaper AND better.",
  },
];
