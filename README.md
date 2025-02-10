# SmartReader Cloud Backend

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  
A backend application for managing, monitoring, and interacting with IoT and RFID devices using **NestJS**, **MQTT**, and **MongoDB**. The system enables real-time control, monitoring, and traceability of devices in dynamic IoT environments.

## 🌐 Features

- **API Key Authentication:** Secure access using API keys with customizable permissions.
- **MQTT Communication:** Send control and management commands to devices and receive events in real time.
- **Device Monitoring:** Track device availability, offline status, and system performance.
- **Event Management:** Capture and store device-generated events for analysis and reporting.
- **Dashboard Metrics:** Expose metrics like uptime, CPU/memory utilization, and antenna status.
- **Swagger API Documentation:** Built-in API documentation for easy exploration and testing.

---

## 🏗️ Architecture Overview

The system follows a modular structure using **NestJS** modules, making it highly maintainable and scalable:

- **ApiKeys Module:** Manages API key creation and validation.
- **MQTT Module:** Handles MQTT communication with devices.
- **Events Module:** Stores and processes device-generated events.
- **Commands Module:** Handles device commands (control and management).
- **Metrics Module:** Provides performance metrics and system status.
- **Monitoring Module:** Monitors device connectivity and triggers offline checks.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **Docker** and **Docker Compose**  
  Optional:
- **MongoDB** (if running locally without Docker)

---

### 🔧 Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/suporterfid/smartreader-cloud-backend.git
   cd smartreader-cloud-backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure the environment**:  
   Copy the `.env.example` to `.env` and configure the following variables:
   ```plaintext
   MONGO_URI=mongodb://mongo:27017/smartreader
   MQTT_URL=mqtt://mosquitto:1883
   API_KEY=YOUR_DEFAULT_API_KEY
   TOPIC_EVENTS=smartreader/+/events
   TOPIC_COMMAND_CONTROL_RESPONSE=smartreader/+/command/control/response
   TOPIC_COMMAND_MANAGEMENT_RESPONSE=smartreader/+/command/management/response
   TOPIC_COMMAND_CONTROL_PUBLISH=smartreader/{deviceSerial}/command/control
   TOPIC_COMMAND_MANAGEMENT_PUBLISH=smartreader/{deviceSerial}/command/management
   ```

---

### 🐳 Running with Docker Compose

To start the application along with MongoDB and Mosquitto services:

```bash
docker-compose up --build
```

The application will be available at:  
http://localhost:3000

---

### 🌍 API Documentation

Access the interactive API documentation at:  
[http://localhost:3000/api](http://localhost:3000/api)  
The documentation is powered by **Swagger UI**.

---

### 🛠️ Development

For development with live reload and debugging enabled:

```bash
npm run start:dev
```

To debug using the Node.js inspector:

```bash
npm run start:dev:debug
```

---

### 📚 Key Endpoints

| Method | Endpoint                         | Description                                    |
| ------ | -------------------------------- | ---------------------------------------------- |
| POST   | `/apikeys`                       | Create a new API key                           |
| GET    | `/apikeys`                       | List all API keys                              |
| POST   | `/devices`                       | Create a new device                            |
| GET    | `/devices`                       | List all devices                               |
| POST   | `/mqtt/:deviceSerial/control`    | Send a control command to a device             |
| POST   | `/mqtt/:deviceSerial/management` | Send a management command to a device          |
| GET    | `/metrics/reader`                | Get metrics for an RFID reader                 |
| GET    | `/monitoring/dashboard`          | Get device availability data for the dashboard |

---

### 🔗 Basic API calls

#### 1. Get API Status

```bash
curl -X GET http://localhost:3000/api/status -H "x-api-key: EXAMPLE_API_KEY"
```

#### 2. List Devices

```bash
curl -X GET http://localhost:3000/api/devices -H "x-api-key: EXAMPLE_API_KEY"
```

#### 3. Register a New Device

```bash
curl -X POST http://localhost:3000/api/devices -H "x-api-key: EXAMPLE_API_KEY" -H "Content-Type: application/json" -d '{
  "name": "RAIN Reader W1",
  "type": "reader",
  "deviceSerial": "37022341016",
  "location": "Warehouse 1"
}'
```

#### 4. Update Device Information

```bash
curl -X PUT http://localhost:3000/api/devices/{deviceId} -H "x-api-key: EXAMPLE_API_KEY" -H "Content-Type: application/json" -d '{
  "name": "Updated Device Name",
  "location": "Updated Location"
}'
```

#### 5. Delete a Device

```bash
curl -X DELETE http://localhost:3000/api/devices/{deviceId} -H "x-api-key: EXAMPLE_API_KEY"
```

#### 6. Send a START Control Command

```bash
curl -X POST http://localhost:3000/api/devices/ABC123/control \
-H "x-api-key: EXAMPLE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "command": "start",
    "command_id": "1234",
    "payload": {}
}'
```

#### 7. Send a STOP Control Command

```bash
curl -X POST http://localhost:3000/api/devices/ABC123/control \
-H "x-api-key: EXAMPLE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "command": "stop",
    "command_id": "1234",
    "payload": {}
}'
```

#### 8. Send a reboot Control Command

```bash
curl -X POST http://localhost:3000/api/devices/ABC123/control \
-H "x-api-key: EXAMPLE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
    "command": "reboot",
    "command_id": "1234",
    "payload": {}
}'
```

#### 9. Send a MODE Control Command

```bash
curl -X POST http://localhost:3000/api/devices/ABC123/control \
-H "x-api-key: EXAMPLE_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "command": "mode",
  "command_id": "12334",
  "payload": {
    "type": "INVENTORY",
    "antennas": [1, 2],
    "antennaZone": "CABINET",
    "antennaZoneState": "enabled",
    "transmitPower": 17.25,
    "groupIntervalInMs": 500,
    "rfMode": "MaxThroughput",
    "searchMode": "single-target",
    "session": "1",
    "tagPopulation": 32,
    "filter": {
      "value": "E280",
      "match": "prefix",
      "operation": "include",
      "status": "enabled"
    },
    "filterIncludeEpcHeaderList": {
      "value": "E280,3031",
      "status": "enabled"
    },
    "rssiFilter": {
      "threshold": -72
    }
  }
}'
```

### 🔗 Default MQTT Topic Structure

Configure your devices to communicate with the backend using the following MQTT topics:

| Topic                                                    | Purpose                                       | Example Topic                                    |
| -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| `smartreader/{deviceSerial}/events`                      | Publish device events to the backend          | `smartreader/ABC123/events`                      |
| `smartreader/{deviceSerial}/command/control`             | Receive control commands from the backend     | `smartreader/ABC123/command/control`             |
| `smartreader/{deviceSerial}/command/control/response`    | Publish command responses back to the backend | `smartreader/ABC123/command/control/response`    |
| `smartreader/{deviceSerial}/command/management`          | Receive management commands from the backend  | `smartreader/ABC123/command/management`          |
| `smartreader/{deviceSerial}/command/management/response` | Publish command responses back to the backend | `smartreader/ABC123/command/management/response` |

#### Example Payloads:

**Event Publishing:**  
Topic: `smartreader/ABC123/events`

```json
{
  "eventType": "status",
  "deviceSerial": "ABC123",
  "timestamp": "2025-02-10T15:30:00Z",
  "data": {
    "CPUUtilization": 45,
    "ReaderOperationalStatus": "enabled"
  }
}
```

**Command Response:**  
Topic: `smartreader/ABC123/command/response`

```json
{
  "commandId": "c12345",
  "status": "success",
  "response": {
    "message": "Device restarted successfully"
  }
}
```

---

### 🛡️ Security

- **API Key Authentication**: Protects most endpoints using an API key passed via the `x-api-key` header.
- Public endpoints are defined using the `@Public()` decorator in the codebase.

---

## 📦 Project Structure

```
smartreader-cloud-backend
├── src
│   ├── api-keys
│   ├── auth
│   ├── commands
│   ├── events
│   ├── metrics
│   ├── monitoring
│   ├── mqtt
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 🧪 Testing

Run tests using **Jest**:

```bash
npm run test
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add feature"`) and push to your branch.
4. Open a Pull Request.

---

## 📧 Contact

For support or inquiries, reach out to:  
[Suporte RFID GitHub](https://github.com/suporterfid/smartreader-cloud-backend)
