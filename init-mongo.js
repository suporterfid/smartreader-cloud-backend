// init-mongo.js
db = db.getSiblingDB("smartreader");

db.createUser({
    user: "dbuser",
    pwd: "dbpassword",
    roles: [{
        role: "readWrite",
        db: "smartreader"
    }]
});

// Create default user
db.createUser({
    user: "smartreader_user",
    pwd: "smartreader_password",
    roles: [{
        role: "readWrite",
        db: "smartreader"
    }]
});

// Create test devices
db.devices.insertMany([
    {
        name: "RAIN Reader W1",
        type: "reader",
        deviceSerial: "37022341016",
        location: "Warehouse 1",
        status: "online",
        modeConfig: {
            type: "INVENTORY",
            antennas: [1, 2],
            antennaZone: "CABINET",
            transmitPower: 17.25
        }
    },
    {
        name: "RAIN Reader W2",
        type: "reader",
        deviceSerial: "37022341017",
        location: "Warehouse 2",
        status: "online",
        modeConfig: {
            type: "INVENTORY",
            antennas: [1, 2],
            antennaZone: "CABINET",
            transmitPower: 17.25
        }
    },
    {
        name: "RAIN Reader W3",
        type: "reader",
        deviceSerial: "37022341018",
        location: "Warehouse 3",
        status: "online",
        modeConfig: {
            type: "INVENTORY",
            antennas: [1, 2],
            antennaZone: "CABINET",
            transmitPower: 17.25
        }
    }
]);

// Create indexes
db.devices.createIndex({ "deviceSerial": 1 }, { unique: true });

db.apikeys.insertOne({
    key: "EXAMPLE_API_KEY",
    description: "Default API Key for development",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Optional: Seed other collections (if necessary)
db.commands.insertOne({
    commandId: "seeded-command-id",
    type: "control",
    deviceSerial: "seeded-device-serial",
    payload: { action: "initial" },
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
});

db.events.insertOne({
    eventType: "status",
    payload: { deviceSerial: "seeded-device-serial", message: "Initial event" },
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create default auth user
// Password is hashed version of "admin123" using bcrypt with salt rounds 10
db.users.insertOne({
    username: "admin",
    password: "$2b$10$5YZVxbkWQxW9DQwXRwvUseK/IWjwEwkh3YLKnP7NG3t7WWv5NOJ4.",
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create index for users
db.users.createIndex({ "username": 1 }, { unique: true });
