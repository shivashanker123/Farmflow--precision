# Water Budget–Based Smart Irrigation System

> "We use one sensor for ground truth and water budgeting for intelligence."

## 🔹 Introduction
Farmers often waste water due to fixed irrigation schedules and a lack of planning based on available water. Existing sensor-heavy systems are costly and complex.

**FarmFlow Precision** solves this by using **only one soil moisture sensor** combined with intelligent **water budgeting logic** to decide exactly when and how much to irrigate. This ensures optimal water usage, validating "Ground Truth" with the sensor and using "Water Budgeting" for intelligence.

## 🔹 Core Features

### 🧠 Intelligent Decision Logic
*   **If Soil is DRY & Water Budget Available** → Irrigate normally.
*   **If Soil is DRY & Water Budget is LOW** → Irrigate partially.
*   **If Soil is MOIST** → Skip irrigation.

### 📊 Dashboard Insights
*   Current soil moisture status (Dry / Optimal / Wet)
*   Remaining water for the season
*   Estimated days of irrigation left
*   Water saved by skipping unnecessary irrigation

### 🌾 Inputs Taken
*   Crop type & attributes (Knowledge base of water requirements)
*   Land area
*   Water source capacity (Tank/Borewell)
*   Crop duration

## 🛠️ Hardware Requirements
*   1× Soil moisture sensor (Representative field area)
*   1× Microcontroller (ESP32 / Arduino)
*   1× Relay (optional for pump control)
*   Pump (for demonstration)

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites
Ensure you have **Node.js** and **npm** installed.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd farmflow-precision
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Project

Start the development server:

```bash
npm run dev
```

Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:8080` or `http://localhost:5173`).

## 🔹 Advantages
*   **Low Cost**: Uses minimum hardware (1 sensor).
*   **Reliable**: Works even if the sensor fails (can fall back to logic).
*   **Scalable**: Suitable for small farmers and easy to upgrade.

## 🔹 Future Scope
*   Integration with weather prediction APIs.
*   AI-based optimization for crop yields.
*   Support for multiple sensors per field.
