```markdown
# SmartReader Cloud API - cURL Examples

This document contains cURL examples for testing the **SmartReader Cloud API**, using `EXAMPLE_API_KEY` for authentication.

---

## **📌 Claim Tokens**

### **1️⃣ Generate a Claim Token**
```bash
curl -X POST http://localhost:3000/claim-tokens \
  -H "x-api-key: EXAMPLE_API_KEY" \
  -H "Content-Type: application/json"
```
#### **✅ Expected Response**
```json
{
  "token": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "expiresAt": "2025-02-26T12:00:00Z"
}
```

### **2️⃣ Verify a Claim Token**
```bash
curl -X GET http://localhost:3000/claim-tokens/123e4567-e89b-12d3-a456-426614174000 \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
{
  "message": "Claim token verified.",
  "status": "pending"
}
```

---

## **📌 API Keys Management**

### **3️⃣ Create a New API Key**
```bash
curl -X POST http://localhost:3000/apikeys \
  -H "x-api-key: EXAMPLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Mobile Application",
    "role": "admin"
  }'
```
#### **✅ Expected Response**
```json
{
  "key": "new-generated-api-key",
  "description": "Mobile Application",
  "role": "admin",
  "active": true
}
```

### **4️⃣ List All API Keys**
```bash
curl -X GET http://localhost:3000/apikeys \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
[
  {
    "key": "EXAMPLE_API_KEY",
    "description": "Default Admin Key",
    "role": "admin",
    "active": true
  }
]
```

---

## **📌 MQTT Commands**

### **5️⃣ Send Control Command to a Device**
```bash
curl -X POST http://localhost:3000/mqtt/ABC123/control \
  -H "x-api-key: EXAMPLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "reboot"
  }'
```
#### **✅ Expected Response**
```json
{
  "message": "Control command sent successfully",
  "deviceSerial": "ABC123",
  "command": "reboot"
}
```

### **6️⃣ Send Management Command to a Device**
```bash
curl -X POST http://localhost:3000/mqtt/ABC123/management \
  -H "x-api-key: EXAMPLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "update-firmware"
  }'
```
#### **✅ Expected Response**
```json
{
  "message": "Management command sent successfully",
  "deviceSerial": "ABC123",
  "command": "update-firmware"
}
```

---

## **📌 Events**

### **7️⃣ Get Events with Filtering**
```bash
curl -X GET "http://localhost:3000/events?deviceSerial=ABC123&epcPrefix=123&antenna=1&rssiMin=-60&rssiMax=-20&from=2025-02-24T00:00:00Z&to=2025-02-25T00:00:00Z" \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
[
  {
    "eventType": "tagRead",
    "deviceSerial": "ABC123",
    "timestamp": "2025-02-24T12:30:45Z",
    "payload": {
      "epc": "123456789ABCDEF",
      "antenna": 1,
      "rssi": -45
    }
  }
]
```

---

## **📌 Commands Management**

### **8️⃣ Get Command History**
```bash
curl -X GET "http://localhost:3000/commands?deviceSerial=ABC123&type=control&status=success" \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
[
  {
    "commandId": "123e4567-e89b-12d3-a456-426614174000",
    "deviceSerial": "ABC123",
    "type": "control",
    "status": "success",
    "payload": {
      "command": "reboot"
    }
  }
]
```

---

## **📌 System Metrics**

### **9️⃣ Get System Metrics**
```bash
curl -X GET "http://localhost:3000/metrics/system?deviceSerial=ABC123" \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
{
  "cpuUsage": 30.5,
  "memoryUsage": 1024,
  "uptime": 86400
}
```

### **🔟 Retrieve Metrics History**
```bash
curl -X GET "http://localhost:3000/metrics/history?from=2025-02-24T00:00:00Z&to=2025-02-25T00:00:00Z" \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
[
  {
    "timestamp": "2025-02-24T12:00:00Z",
    "cpuUsage": 35.2,
    "memoryUsage": 2048
  }
]
```

---

## **📌 Monitoring Dashboard**

### **1️⃣1️⃣ Get Availability Data for Dashboard**
```bash
curl -X GET "http://localhost:3000/monitoring/dashboard?from=2025-02-24T00:00:00Z&to=2025-02-25T00:00:00Z" \
  -H "x-api-key: EXAMPLE_API_KEY"
```
#### **✅ Expected Response**
```json
{
  "totalDevices": 10,
  "offlineDevices": 2,
  "uptimePercentage": 98.5
}
```

---

## **📌 Webhooks Management**

### **1️⃣2️⃣ Subscribe to a Webhook**
```bash
curl -X POST http://localhost:3000/webhooks \
  -H "x-api-key: EXAMPLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/example",
    "eventType": "tagRead"
  }'
```
#### **✅ Expected Response**
```json
{
  "message": "Webhook subscribed successfully",
  "url": "https://webhook.site/example",
  "eventType": "tagRead"
}
```
