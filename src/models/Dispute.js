import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    // Dispute Identification
    disputeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Party A Information
    partyA: {
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
        required: true,
      },
      email: String,
      address: {
        type: String,
        required: true,
      },
    },

    // Party B Information
    partyB: {
      name: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
        required: true,
      },
      email: String,
      address: {
        type: String,
        required: true,
      },
    },

    // Dispute Details
    category: {
      type: String,
      required: true,
      enum: [
        "Land",
        "Society",
        "Benefits",
        "Tenancy",
        "Family",
        "Property",
        "Other",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    incidentDate: Date,
    incidentPlace: String,

    // Location Details
    district: String,
    mandal: String,
    ward: String,
    pincode: String,

    // Status & Assignment
    status: {
      type: String,
      enum: [
        "NEW",
        "UNDER_REVIEW",
        "MEDIATION_SCHEDULED",
        "IN_MEDIATION",
        "SETTLED",
        "REFERRED_TO_COURT",
        "CLOSED",
      ],
      default: "NEW",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    mediator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Hearing Details
    hearingDate: Date,
    hearingTime: String,
    hearingPlace: String,
    hearingNotes: String,

    // SLA & Timing
    sla: {
      duration: String, // e.g., "48h", "7d"
      dueDate: Date,
      status: {
        type: String,
        enum: ["within-sla", "approaching-breach", "breached"],
        default: "within-sla",
      },
      breachedAt: Date,
    },

    // Documents
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

    // Tracking
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        comments: String,
      },
    ],

    // Comments & Notes
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Mediation Progress
    mediationNotes: String,
    settlementTerms: String,
    settlementDate: Date,

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ assignedTo: 1, status: 1 });
disputeSchema.index({ district: 1 });
disputeSchema.index({ category: 1 });
disputeSchema.index({ hearingDate: 1 });

// Generate Dispute ID
disputeSchema.statics.generateDisputeId = async function (district) {
  const prefix = "DSP";
  const state = "AP";
  const districtCode = (district || "GEN").substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();

  // Find the last dispute ID for this year
  const lastDispute = await this.findOne({
    disputeId: new RegExp(`^${prefix}-${state}-${districtCode}-${year}-`),
  }).sort({ disputeId: -1 });

  let sequence = 1;
  if (lastDispute) {
    const lastSequence = parseInt(lastDispute.disputeId.split("-").pop());
    sequence = lastSequence + 1;
  }

  return `${prefix}-${state}-${districtCode}-${year}-${String(
    sequence
  ).padStart(6, "0")}`;
};

// Methods
disputeSchema.methods.updateStatus = function (newStatus, userId, comments) {
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    comments,
  });
  this.status = newStatus;
};

disputeSchema.methods.scheduleHearing = function (date, time, place, notes) {
  this.hearingDate = date;
  this.hearingTime = time;
  this.hearingPlace = place;
  this.hearingNotes = notes;
  this.status = "MEDIATION_SCHEDULED";
};

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
