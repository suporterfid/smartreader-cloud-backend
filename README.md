# SmartReader Cloud Backend

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  
A backend application for managing, monitoring, and interacting with IoT and RFID devices using **NestJS**, **MQTT**, and **MongoDB**. The system enables real-time control, monitoring, and traceability of devices in dynamic IoT environments.

## 🌐 Features

- **API Key Authentication:** Secure access using API keys with customizable permissions.
- **Role-Based Access Control (RBAC):** Assigns `admin`, `operator`, and `viewer` roles for fine-grained access.
- **Rate Limiting:** Uses `nestjs/throttler` to enforce per-role API rate limits.
- **Device Management:** Register, update, and monitor IoT and RFID devices.
- **MQTT Communication:** Send control and management commands to devices and receive events in real time.
- **Event Tracking:** Stores and processes device-generated events.
- **Metrics & Monitoring:** Tracks system load, uptime, resource usage, and device connectivity.
- **Webhook Integration:** Allows external services to subscribe to real-time device events.
- **Prometheus & Grafana Integration:** Provides real-time system monitoring with a `/metrics` endpoint for Prometheus scraping.
- **Swagger API Documentation:** Built-in API documentation for easy exploration and testing.
- **Postman Collection:** [API cURL Examples](api-curl-examples.md) included for easy API testing.

---

## 🏗️ Architecture Overview

The system follows a modular structure using **NestJS** modules, making it highly maintainable and scalable:

- **ApiKeys Module:** Manages API key creation, validation, and role-based access.
- **Auth Module:** Provides middleware for API key authentication and RBAC enforcement.
- **Throttler Module:** Implements request throttling based on user roles.
- **MQTT Module:** Handles MQTT communication with devices.
- **Events Module:** Stores and processes device-generated events.
- **Commands Module:** Manages control and management commands for IoT devices.
- **Metrics Module:** Provides system performance metrics and device uptime tracking.
- **Monitoring Module:** Monitors device connectivity and offline status.
- **Webhooks Module:** Manages webhook subscriptions and event dispatching.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **pnpm** (if not installed, run `corepack enable && corepack prepare pnpm@latest --activate`)
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
````

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Configure the environment**:  
   Copy the `.env.example` to `.env` and configure the following variables:
   ```plaintext
   MONGO_URI=mongodb://mongo:27017/smartreader
   MQTT_URL=mqtt://mosquitto:1883
   API_KEY=EXAMPLE_API_KEY
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

For detailed **cURL examples**, see:  
[API cURL Examples](api-curl-examples.md)

---

### 🛠️ Development

For development with live reload and debugging enabled:

```bash
pnpm run start:dev
```

To debug using the Node.js inspector:

```bash
pnpm run start:dev:debug
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

### 🔗 Default MQTT Topic Structure

Configure your devices to communicate with the backend using the following MQTT topics:

| Topic                                                    | Purpose                                       | Example Topic                                    |
| -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| `smartreader/{deviceSerial}/events`                      | Publish device events to the backend          | `smartreader/ABC123/events`                      |
| `smartreader/{deviceSerial}/command/control`             | Receive control commands from the backend     | `smartreader/ABC123/command/control`             |
| `smartreader/{deviceSerial}/command/control/response`    | Publish command responses back to the backend | `smartreader/ABC123/command/control/response`    |
| `smartreader/{deviceSerial}/command/management`          | Receive management commands from the backend  | `smartreader/ABC123/command/management`          |
| `smartreader/{deviceSerial}/command/management/response` | Publish command responses back to the backend | `smartreader/ABC123/command/management/response` |

---

### 📊 Prometheus & Grafana Integration

- The application exposes system metrics for **Prometheus** at:

  ```
  http://localhost:3000/metrics
  ```

- **Grafana** can be configured to pull data from Prometheus for visualization.

To start monitoring services:

```bash
docker-compose up -d prometheus grafana
```

---

### 🛡️ Security

- **API Key Authentication**: Protects most endpoints using an API key passed via the `x-api-key` header.
- **RBAC (Role-Based Access Control)**: Restricts API access based on user roles (`admin`, `operator`, `viewer`).
- **Rate Limiting**: Prevents excessive API usage per key.
- **Webhook Signature Verification**: Ensures secure event dispatching.

---

## 📦 Project Structure

[Detailed project structure](project-structure.md)

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

```

