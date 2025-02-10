db = db.getSiblingDB("smartreader");  // Replace "smartreader" if using a different database

db.createUser({
    user: "dbuser",
    pwd: "dbpassword",
    roles: [{
        role: "readWrite",
        db: "smartreader"
    }]
});


db.createCollection('apikeys');

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


