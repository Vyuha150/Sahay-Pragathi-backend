import mongoose from "mongoose";

const templeSchema = new mongoose.Schema(
  {
    // Temple Letter Identification
    templeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    address: String,
    aadhaarNumber: String,

    // Temple Details
    templeName: {
      type: String,
      required: true,
    },
    darshanType: {
      type: String,
      required: true,
      enum: ["VIP", "GENERAL", "SPECIAL", "DIVYA_DARSHAN", "SARVA_DARSHAN"],
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    numberOfPeople: {
      type: Number,
      default: 1,
    },

    // Location Details
    district: String,
    mandal: String,
    ward: String,
    pincode: String,

    // Status & Assignment
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "LETTER_ISSUED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "REQUESTED",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Quota Information
    quotaAvailable: Number,
    quotaAllocated: Number,

    // Letter Details
    letterNumber: String,
    letterIssuedDate: Date,
    letterValidUntil: Date,

    // Additional Information
    purpose: String,
    remarks: String,
    rejectReason: String,

    // Documents
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
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

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
templeSchema.index({ status: 1, createdAt: -1 });
templeSchema.index({ assignedTo: 1, status: 1 });
templeSchema.index({ templeName: 1, preferredDate: 1 });
templeSchema.index({ preferredDate: 1 });

// Methods
templeSchema.methods.updateStatus = function (newStatus, userId, comments) {
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    comments,
  });
  this.status = newStatus;
};

templeSchema.methods.addComment = function (userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date(),
  });
};

// Static method to generate temple letter ID
templeSchema.statics.generateTempleId = async function (district = "AP") {
  const prefix = "TDL";
  const districtCode = district.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();

  // Find the latest temple letter for this year
  const latestTemple = await this.findOne({
    templeId: new RegExp(`^${prefix}-${districtCode}-${year}-`),
  })
    .sort({ createdAt: -1 })
    .lean();

  let sequence = 1;
  if (latestTemple) {
    const match = latestTemple.templeId.match(/-(\d+)$/);
    if (match) {
      sequence = parseInt(match[1]) + 1;
    }
  }

  const sequenceStr = sequence.toString().padStart(6, "0");
  return `${prefix}-${districtCode}-${year}-${sequenceStr}`;
};

const Temple = mongoose.model("Temple", templeSchema);

export default Temple;
