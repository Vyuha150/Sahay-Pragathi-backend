import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    // Case Identification
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    caseType: {
      type: String,
      required: true,
      enum: [
        "grievance",
        "dispute",
        "temple",
        "cmr",
        "education",
        "csr",
        "appointment",
        "program",
      ],
    },

    // Citizen Information
    citizenName: {
      type: String,
      required: true,
    },
    citizenContact: {
      phone: String,
      email: String,
      address: String,
    },

    // Common Case Details
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reason: String,
    place: String,
    time: Date,

    // Module-Specific Fields - Grievance
    category: String,
    mobile: String,

    // Module-Specific Fields - Dispute
    partyA: String,
    partyB: String,
    disputeCategory: String,

    // Module-Specific Fields - Temple
    applicantName: String,
    templeId: String,
    darshanType: String,
    preferredDate: Date,

    // Module-Specific Fields - CMR (CM Relief)
    patientName: String,
    ailment: String,
    hospitalName: String,
    estimatedAmount: Number,

    // Module-Specific Fields - Education
    studentName: String,
    courseDetails: String,
    institutionName: String,

    // Module-Specific Fields - CSR
    companyName: String,
    projectTitle: String,
    proposedBudget: Number,

    // Module-Specific Fields - Appointment
    appointmentDate: Date,
    appointmentTime: String,
    purposeOfVisit: String,

    // Module-Specific Fields - Program
    programType: String,
    venue: String,
    expectedAttendees: Number,
    priority: {
      type: String,
      enum: ["P1", "P2", "P3", "P4"],
      default: "P3",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in-progress",
        "under-review",
        "approved",
        "rejected",
        "completed",
        "closed",
      ],
      default: "pending",
    },

    // Assignment & Workflow
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: String,
      required: true,
    },
    district: String,
    mandal: String,
    ward: String,
    pincode: String,

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

    // Assignment Notes
    assignmentNotes: String,

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
caseSchema.index({ status: 1, createdAt: -1 });
caseSchema.index({ assignedTo: 1, status: 1 });
caseSchema.index({ department: 1, district: 1 });
caseSchema.index({ "sla.dueDate": 1 });

// Methods
caseSchema.methods.updateStatus = function (newStatus, userId, comments) {
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    comments,
  });
  this.status = newStatus;
  return this.save();
};

caseSchema.methods.addComment = function (userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date(),
  });
  return this.save();
};

// Virtual for case age
caseSchema.virtual("ageInDays").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

export default mongoose.model("Case", caseSchema);
