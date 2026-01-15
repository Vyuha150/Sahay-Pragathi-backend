import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    // Unique ID
    educationId: {
      type: String,
      unique: true,
      required: true,
    },

    // Student Information
    studentName: {
      type: String,
      required: true,
    },
    fatherOrGuardianName: String,
    dateOfBirth: Date,
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

    // Education Details
    educationType: {
      type: String,
      required: true,
      enum: [
        "SCHOOL",
        "INTERMEDIATE",
        "UNDERGRADUATE",
        "POSTGRADUATE",
        "DIPLOMA",
        "VOCATIONAL",
        "SKILL_TRAINING",
        "OTHER",
      ],
    },
    currentClass: String,
    institutionName: {
      type: String,
      required: true,
    },
    institutionType: {
      type: String,
      enum: ["GOVERNMENT", "PRIVATE", "AIDED"],
    },
    courseOrStream: String,
    academicYear: String,
    rollNumber: String,

    // Support Details
    supportType: {
      type: String,
      required: true,
      enum: [
        "TUITION_FEE",
        "BOOKS",
        "UNIFORM",
        "TRANSPORT",
        "HOSTEL_FEE",
        "EXAM_FEE",
        "LAPTOP",
        "SCHOLARSHIP",
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

    // Academic Performance
    academicPerformance: {
      lastExamPercentage: Number,
      gpa: Number,
      rank: Number,
      achievements: String,
      attendance: Number,
    },

    // Financial Details
    familyIncome: {
      monthlyIncome: Number,
      occupation: String,
      familyMembers: Number,
      siblings: Number,
      siblingsInEducation: Number,
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

// Generate unique Education ID
educationSchema.statics.generateEducationId = async function (district) {
  const year = new Date().getFullYear();
  const districtCode = district
    ? district.substring(0, 3).toUpperCase()
    : "GEN";

  // Find the last Education ID for this year and district
  const lastEducation = await this.findOne({
    educationId: new RegExp(`^EDU-${districtCode}-${year}-`),
  })
    .sort({ createdAt: -1 })
    .lean();

  let sequence = 1;
  if (lastEducation && lastEducation.educationId) {
    const lastSequence = parseInt(lastEducation.educationId.split("-").pop());
    sequence = lastSequence + 1;
  }

  return `EDU-${districtCode}-${year}-${sequence.toString().padStart(6, "0")}`;
};

// Static method to update status
educationSchema.statics.updateStatus = async function (
  educationId,
  status,
  userId,
  comments
) {
  const education = await this.findOne({ educationId });
  if (!education) {
    throw new Error("Education support request not found");
  }

  education.status = status;
  education.statusHistory.push({
    status,
    changedBy: userId,
    changedAt: new Date(),
    comments: comments || `Status changed to ${status}`,
  });

  await education.save();
  return education;
};

// Instance method to add comment
educationSchema.methods.addComment = function (userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date(),
  });
};

const Education = mongoose.model("Education", educationSchema);

export default Education;
