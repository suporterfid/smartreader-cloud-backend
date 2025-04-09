// src/devices/schemas/device.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Define the filter structure
export class TagFilter {
  value: string;
  match: string;
  operation: string;
  status: string;
}

// Define the rssiFilter structure
export class RssiFilter {
  threshold: number;
}

// Define the filterIncludeEpcHeaderList structure
export class FilterIncludeEpcHeaderList {
  value: string;
  status: string;
}

// Define the modeConfig structure
export class ModeConfig {
  type: string;
  antennas: number[];
  antennaZone: string;
  antennaZoneState?: string;
  transmitPower: number;
  groupIntervalInMs?: number;
  rfMode?: string;
  searchMode?: string;
  session?: string;
  tagPopulation?: number;
  filter?: TagFilter;
  filterIncludeEpcHeaderList?: FilterIncludeEpcHeaderList;
  rssiFilter?: RssiFilter;
}

// Create an interface that extends Document and includes our custom methods
export interface DeviceDocument extends Document {
  name: string;
  type: string;
  deviceSerial: string;
  location: string;
  active: boolean;
  lastSeen?: Date;
  firmwareVersion?: string;
  communicationTimeout: number;
  communicationStatus: string;
  modeConfig: ModeConfig;
  networkSettings: Record<string, any>;
  ledControl: Record<string, any>;
  operationalMode: string;

  // Define the custom method
  isOffline(): boolean;
}

@Schema({ timestamps: true, collection: 'devices' })
export class Device {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // e.g., sensor, reader, etc.

  @Prop({ required: true, unique: true })
  deviceSerial: string;

  @Prop()
  location: string;

  @Prop({ default: true })
  active: boolean;
  
  @Prop({ default: null })
  lastSeen?: Date;

  @Prop({ default: null })
  firmwareVersion?: string;
  
  // New property for communication timeout in seconds
  @Prop({ default: 300 }) // Default 5 minutes (300 seconds)
  communicationTimeout: number;
  
  // Computed field for communication status
  @Prop({ 
    type: String,
    enum: ['online', 'offline', 'unknown'],
    default: 'unknown'
  })
  communicationStatus: string;

  @Prop({ 
    type: Object, 
    required: true,
    default: {
      type: "INVENTORY",
      antennas: [1, 2],
      antennaZone: "CABINET",
      transmitPower: 17.25
    }
  })
  modeConfig: ModeConfig;

  @Prop({
    type: {
      wifiSSID: { type: String, default: null },
      wifiPassword: { type: String, default: null },
      ethernetIP: { type: String, default: null },
    },
    default: {},
  })
  networkSettings: Record<string, any>;
  
  @Prop({
    type: {
      powerState: { type: Boolean, default: true },
      brightness: { type: Number, min: 0, max: 100, default: 50 },
    },
    default: {},
  })
  ledControl: Record<string, any>;
  
  @Prop({ enum: ['normal', 'low-power', 'debug'], default: 'normal' })
  operationalMode: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);

// Add method to check if device is offline based on timeout
DeviceSchema.methods.isOffline = function(): boolean {
  if (!this.lastSeen) {
    return true; // No communication recorded yet
  }
  
  const now = new Date();
  const lastSeen = new Date(this.lastSeen);
  const diffSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);
  
  return diffSeconds > this.communicationTimeout;
};

// Virtual property for status - using a getter function
DeviceSchema.virtual('status').get(function() {
  if (!this.active) {
    return 'disabled';
  }
  
  // Instead of calling isOffline() directly, we'll check the status based on the same logic
  if (!this.lastSeen) {
    return 'offline';
  }
  
  const now = new Date();
  const lastSeen = new Date(this.lastSeen);
  const diffSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);
  
  return diffSeconds > this.communicationTimeout ? 'offline' : 'online';
});
