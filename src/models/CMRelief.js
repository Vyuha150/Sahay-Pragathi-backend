import mongoose from "mongoose";

const cmReliefSchema = new mongoose.Schema(
  {
    // Unique ID
    cmrfId: {
      type: String,
      unique: true,
      required: true,
    },

    // Applicant Information
    applicantName: {
      type: String,
      required: true,
    },
    fatherOrHusbandName: String,
    age: Number,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    mobile: {
      type: String,
      required: true,
    },
    email: String,
    aadhaarNumber: String,
    address: String,
    district: String,
    mandal: String,
    ward: String,
    pincode: String,

    // Relief Details
    reliefType: {
      type: String,
      required: true,
      enum: [
        "MEDICAL",
        "EDUCATION",
        "ACCIDENT",
        "NATURAL_DISASTER",
        "FINANCIAL_ASSISTANCE",
        "FUNERAL",
        "OTHER",
      ],
    },
    requestedAmount: {
      type: Number,
      required: true,
    },
    approvedAmount: Number,
    purpose: String,
    urgency: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    // Medical Details (if reliefType is MEDICAL)
    medicalDetails: {
      hospitalName: String,
      disease: String,
      treatmentCost: Number,
      doctorName: String,
      admissionDate: Date,
    },

    // Financial Details
    incomeDetails: {
      monthlyIncome: Number,
      occupation: String,
      familyMembers: Number,
      dependents: Number,
    },

    // Bank Details
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String,
      accountHolderName: String,
    },

    // Status & Assignment
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "UNDER_REVIEW",
        "VERIFICATION_PENDING",
        "APPROVED",
        "REJECTED",
        "AMOUNT_DISBURSED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "REQUESTED",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    // Verification
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationDate: Date,
    verificationNotes: String,

    // Disbursement
    disbursementDetails: {
      amount: Number,
      transactionId: String,
      disbursementDate: Date,
      disbursementMode: {
        type: String,
        enum: ["BANK_TRANSFER", "CHEQUE", "CASH", "DD"],
      },
      remarks: String,
    },

    // Approval/Rejection
    approvalDetails: {
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvalDate: Date,
      approvalNotes: String,
    },
    rejectReason: String,

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

    // Comments/Notes
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
  },
  {
    timestamps: true,
  }
);

// Generate unique CMRF ID
cmReliefSchema.statics.generateCMRFId = async function (district) {
  const year = new Date().getFullYear();
  const districtCode = district
    ? district.substring(0, 3).toUpperCase()
    : "GEN";

  // Find the last CMRF ID for this year and district
  const lastCMRF = await this.findOne({
    cmrfId: new RegExp(`^CMRF-${districtCode}-${year}-`),
  })
    .sort({ createdAt: -1 })
    .lean();

  let sequence = 1;
  if (lastCMRF && lastCMRF.cmrfId) {
    const lastSequence = parseInt(lastCMRF.cmrfId.split("-").pop());
    sequence = lastSequence + 1;
  }

  return `CMRF-${districtCode}-${year}-${sequence.toString().padStart(6, "0")}`;
};

// Static method to update status
cmReliefSchema.statics.updateStatus = async function (
  cmrfId,
  status,
  userId,
  comments
) {
  const cmrf = await this.findOne({ cmrfId });
  if (!cmrf) {
    throw new Error("CM Relief request not found");
  }

  cmrf.status = status;
  cmrf.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    comments: comments || `Status changed to ${status}`,
  });

  await cmrf.save();
  return cmrf;
};

// Instance method to add comment
cmReliefSchema.methods.addComment = function (userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date(),
  });
};

const CMRelief = mongoose.model("CMRelief", cmReliefSchema);

export default CMRelief;
