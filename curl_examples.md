
# CURL Examples for Testing SmartReader Cloud Backend REST Endpoints

This guide provides `curl` commands to test the key RESTful API endpoints available in the **SmartReader Cloud Backend**. 

Ensure that you have a valid API key and that the application is running before executing these commands.

---

## 🔑 Authentication
Replace `<API_KEY>` with your actual API key when testing endpoints.
```bash
API_KEY=<your_api_key>
```

---

## 1. **API Keys**

### Create a New API Key
```bash
curl -X POST http://localhost:3000/apikeys -H "x-api-key: $API_KEY" -H "Content-Type: application/json" -d '{
  "description": "Test API Key"
}'
```

### List All API Keys
```bash
curl -X GET http://localhost:3000/apikeys -H "x-api-key: $API_KEY"
```

### Get Details of an API Key
```bash
curl -X GET http://localhost:3000/apikeys/<id> -H "x-api-key: $API_KEY"
```

### Update an API Key
```bash
curl -X PUT http://localhost:3000/apikeys/<id> -H "x-api-key: $API_KEY" -H "Content-Type: application/json" -d '{
  "description": "Updated Description",
  "active": false
}'
```

### Delete an API Key
```bash
curl -X DELETE http://localhost:3000/apikeys/<id> -H "x-api-key: $API_KEY"
```

---

## 2. **MQTT Commands**

### Send a Control Command to a Device
```bash
curl -X POST http://localhost:3000/mqtt/<deviceSerial>/control -H "x-api-key: $API_KEY" -H "Content-Type: application/json" -d '{
  "commandType": "RESTART",
  "parameters": {
    "delay": 5
  }
}'
```

### Send a Management Command to a Device
```bash
curl -X POST http://localhost:3000/mqtt/<deviceSerial>/management -H "x-api-key: $API_KEY" -H "Content-Type: application/json" -d '{
  "commandType": "UPDATE_FIRMWARE",
  "parameters": {
    "version": "1.2.3"
  }
}'
```

---

## 3. **Metrics**

### Get Reader Metrics
```bash
curl -X GET "http://localhost:3000/metrics/reader?deviceSerial=<deviceSerial>&from=2023-01-01T00:00:00Z&to=2023-01-31T23:59:59Z" -H "x-api-key: $API_KEY"
```

### Get Antenna Metrics
```bash
curl -X GET "http://localhost:3000/metrics/antennas?deviceSerial=<deviceSerial>&from=2023-01-01T00:00:00Z&to=2023-01-31T23:59:59Z" -H "x-api-key: $API_KEY"
```

### Get System Metrics
```bash
curl -X GET "http://localhost:3000/metrics/system?deviceSerial=<deviceSerial>&from=2023-01-01T00:00:00Z&to=2023-01-31T23:59:59Z" -H "x-api-key: $API_KEY"
```

### Get Offline Devices
```bash
curl -X GET "http://localhost:3000/metrics/offline?minutes=30" -H "x-api-key: $API_KEY"
```

---

## 4. **Monitoring**

### Get Dashboard Availability Data
```bash
curl -X GET "http://localhost:3000/monitoring/dashboard?from=2023-01-01T00:00:00Z&to=2023-01-31T23:59:59Z" -H "x-api-key: $API_KEY"
```

Optional: Add `&deviceSerial=<deviceSerial>` to filter by device.

---

## 5. **Events**

### Get Stored Events
```bash
curl -X GET "http://localhost:3000/events?type=status&deviceSerial=<deviceSerial>&from=2023-01-01T00:00:00Z&to=2023-01-31T23:59:59Z" -H "x-api-key: $API_KEY"
```

---

## 📄 Notes
- Replace `localhost:3000` with the appropriate host and port if running on a different environment.
- Make sure your API key has sufficient permissions to access these endpoints.
