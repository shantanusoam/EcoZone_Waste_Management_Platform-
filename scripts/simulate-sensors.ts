#!/usr/bin/env npx tsx

/**
 * IoT Sensor Simulation Script
 * 
 * Simulates sensor data from waste bins to test the telemetry endpoint.
 * Bins gradually fill up over time, and occasionally get "collected" (reset to 0).
 * 
 * Usage:
 *   npx tsx scripts/simulate-sensors.ts
 * 
 * Environment variables:
 *   API_URL - Base URL of the API (default: http://localhost:3000)
 *   API_KEY - Telemetry API key (optional)
 *   INTERVAL - Update interval in ms (default: 5000)
 */

const API_URL = process.env.API_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "";
const INTERVAL = parseInt(process.env.INTERVAL || "5000", 10);

// Sensor IDs from seed data
const SENSOR_IDS = [
  "SENSOR-001", "SENSOR-002", "SENSOR-003", "SENSOR-004", "SENSOR-005",
  "SENSOR-006", "SENSOR-007", "SENSOR-008", "SENSOR-009", "SENSOR-010",
  "SENSOR-011", "SENSOR-012", "SENSOR-013", "SENSOR-014", "SENSOR-015",
];

// Track simulated state
interface SensorState {
  fill_level: number;
  battery_level: number;
}

const sensorStates: Map<string, SensorState> = new Map();

// Initialize sensors with random starting values
function initializeSensors() {
  for (const sensorId of SENSOR_IDS) {
    sensorStates.set(sensorId, {
      fill_level: Math.floor(Math.random() * 60) + 10, // 10-70%
      battery_level: Math.floor(Math.random() * 30) + 70, // 70-100%
    });
  }
  console.log(`Initialized ${SENSOR_IDS.length} sensors`);
}

// Simulate sensor value changes
function simulateSensorUpdate(sensorId: string): SensorState {
  const state = sensorStates.get(sensorId)!;
  
  // Fill level increases over time (simulating waste accumulation)
  // Random increase between 1-8%
  const fillIncrease = Math.floor(Math.random() * 8) + 1;
  state.fill_level = Math.min(100, state.fill_level + fillIncrease);
  
  // Occasionally simulate collection (10% chance if fill > 80%)
  if (state.fill_level > 80 && Math.random() < 0.1) {
    console.log(`🗑️  ${sensorId} collected! Fill reset to 0%`);
    state.fill_level = 0;
  }
  
  // Battery slowly drains
  if (Math.random() < 0.1) {
    state.battery_level = Math.max(0, state.battery_level - 1);
  }
  
  sensorStates.set(sensorId, state);
  return state;
}

// Send telemetry data to API
async function sendTelemetry(sensorId: string, state: SensorState) {
  const payload = {
    sensor_id: sensorId,
    fill_level: state.fill_level,
    battery_level: state.battery_level,
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (API_KEY) {
      headers["x-api-key"] = API_KEY;
    }

    const response = await fetch(`${API_URL}/api/telemetry`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ ${sensorId}: ${error.error || response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ ${sensorId}: Network error -`, (error as Error).message);
    return false;
  }
}

// Main simulation loop
async function runSimulation() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           EcoZone IoT Sensor Simulator                   ║
╠══════════════════════════════════════════════════════════╣
║  API URL:  ${API_URL.padEnd(44)}║
║  Interval: ${(INTERVAL + "ms").padEnd(44)}║
║  Sensors:  ${(SENSOR_IDS.length + "").padEnd(44)}║
╚══════════════════════════════════════════════════════════╝
`);

  initializeSensors();

  console.log("\n📡 Starting simulation... (Press Ctrl+C to stop)\n");

  let iteration = 0;

  const tick = async () => {
    iteration++;
    
    // Select a random subset of sensors to update (simulate not all sensors reporting at once)
    const sensorsToUpdate = SENSOR_IDS.filter(() => Math.random() < 0.4);
    
    if (sensorsToUpdate.length === 0) {
      sensorsToUpdate.push(SENSOR_IDS[Math.floor(Math.random() * SENSOR_IDS.length)]);
    }

    console.log(`\n[${new Date().toLocaleTimeString()}] Iteration ${iteration} - Updating ${sensorsToUpdate.length} sensors`);

    let successCount = 0;
    for (const sensorId of sensorsToUpdate) {
      const state = simulateSensorUpdate(sensorId);
      const success = await sendTelemetry(sensorId, state);
      if (success) {
        successCount++;
        const fillBar = "█".repeat(Math.floor(state.fill_level / 10)) + "░".repeat(10 - Math.floor(state.fill_level / 10));
        const color = state.fill_level > 80 ? "🔴" : state.fill_level > 50 ? "🟡" : "🟢";
        console.log(`  ${color} ${sensorId}: ${fillBar} ${state.fill_level}% | 🔋 ${state.battery_level}%`);
      }
    }

    console.log(`  ✅ ${successCount}/${sensorsToUpdate.length} updates sent`);
  };

  // Run first tick immediately
  await tick();

  // Then run on interval
  setInterval(tick, INTERVAL);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Simulation stopped");
  process.exit(0);
});

// Start
runSimulation().catch(console.error);
