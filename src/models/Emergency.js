import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    // Unique ID
    emergencyId: {
      type: String,
      unique: true,
      // Don't require it since it's auto-generated in pre-save hook
    },

    // Applicant Information
    applicantName: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    email: String,
    aadhaarNumber: String,

    // Emergency Details
    emergencyType: {
      type: String,
      required: true,
      enum: [
        "MEDICAL",
        "POLICE",
        "FIRE",
        "NATURAL_DISASTER",
        "ACCIDENT",
        "OTHER",
      ],
    },
    location: {
      type: String,
      required: true,
    },
    gpsCoordinates: {
      latitude: Number,
      longitude: Number,
    },
    description: {
      type: String,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },

    // Location Details
    district: String,
    mandal: String,
    ward: String,
    landmark: String,
    pincode: String,

    // Response Details
    officerContact: String,
    responderName: String,
    responderContact: String,
    actionTaken: String,
    responseTime: Date,
    resolutionTime: Date,

    // Status & Assignment
    status: {
      type: String,
      enum: [
        "LOGGED",
        "DISPATCHED",
        "IN_PROGRESS",
        "RESOLVED",
        "CANCELLED",
        "CLOSED",
      ],
      default: "LOGGED",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },

    // Additional Information
    numberOfPeopleAffected: Number,
    estimatedDamage: String,
    immediateNeedsProvided: String,
    followUpRequired: Boolean,
    followUpDetails: String,

    // Documentation
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: String,
    internalNotes: String,

    // Escalation
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    escalationReason: String,
    escalationDate: Date,

    // Closure
    closureNotes: String,
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance (emergencyId already has unique: true, so no need to index again)
emergencySchema.index({ status: 1 });
emergencySchema.index({ emergencyType: 1 });
emergencySchema.index({ urgency: 1 });
emergencySchema.index({ createdAt: -1 });
emergencySchema.index({ assignedTo: 1 });

// Generate emergency ID before saving
emergencySchema.pre("save", async function (next) {
  if (!this.emergencyId) {
    const count = await mongoose.model("Emergency").countDocuments();
    this.emergencyId = `EMR-${Date.now()}-${count + 1}`;
  }
  next();
});

const Emergency = mongoose.model("Emergency", emergencySchema);

export default Emergency;
