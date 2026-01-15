import mongoose from "mongoose";

const csrIndustrialSchema = new mongoose.Schema(
  {
    // Unique ID
    csrId: {
      type: String,
      unique: true,
      required: true,
    },

    // Company Information
    companyName: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      enum: ["PUBLIC", "PRIVATE", "MNC", "PSU", "STARTUP", "NGO"],
    },
    cinNumber: String,
    panNumber: String,
    gstNumber: String,
    companyAddress: String,
    companyWebsite: String,
    industry: String,

    // Contact Information
    contactPersonName: {
      type: String,
      required: true,
    },
    contactDesignation: String,
    contactMobile: {
      type: String,
      required: true,
    },
    contactEmail: String,
    alternateContactName: String,
    alternateContactMobile: String,
    alternateContactEmail: String,

    // Project Information
    projectName: {
      type: String,
      required: true,
    },
    projectCategory: {
      type: String,
      enum: [
        "EDUCATION",
        "HEALTHCARE",
        "RURAL_DEVELOPMENT",
        "SKILL_DEVELOPMENT",
        "INFRASTRUCTURE",
        "ENVIRONMENT",
        "SPORTS",
        "CULTURE",
        "DISASTER_RELIEF",
        "OTHER",
      ],
    },
    projectDescription: String,
    projectObjectives: String,
    targetBeneficiaries: String,
    expectedOutcomes: String,

    // Location Details
    district: String,
    mandal: String,
    village: String,
    implementationArea: String,

    // Financial Information
    proposedBudget: {
      type: Number,
      required: true,
    },
    approvedBudget: Number,
    fundingModel: {
      type: String,
      enum: ["FULL_FUNDING", "PARTIAL_FUNDING", "MATCHING_GRANT", "IN_KIND"],
    },
    budgetBreakdown: [
      {
        category: String,
        amount: Number,
        description: String,
      },
    ],

    // Timeline
    proposedStartDate: Date,
    proposedEndDate: Date,
    actualStartDate: Date,
    actualEndDate: Date,
    duration: Number, // in months

    // MoU Details
    mouSignedDate: Date,
    mouValidUpto: Date,
    mouDocumentUrl: String,
    agreementTerms: String,

    // Milestones
    milestones: [
      {
        milestoneName: String,
        description: String,
        targetDate: Date,
        completionDate: Date,
        status: {
          type: String,
          enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "DELAYED"],
          default: "PENDING",
        },
        deliverables: String,
        amountDisbursed: Number,
        verificationNotes: String,
      },
    ],

    // Progress Tracking
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    progressNotes: String,
    lastReviewDate: Date,
    nextReviewDate: Date,

    // Impact Assessment
    beneficiariesReached: Number,
    impactMetrics: [
      {
        metric: String,
        target: String,
        achieved: String,
        unit: String,
      },
    ],
    testimonials: String,
    mediaCoverage: String,

    // Due Diligence
    dueDiligenceStatus: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"],
      default: "PENDING",
    },
    dueDiligenceNotes: String,
    dueDiligenceCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dueDiligenceCompletedDate: Date,
    riskAssessment: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
    },

    // Status
    status: {
      type: String,
      required: true,
      enum: [
        "LEAD",
        "DUE_DILIGENCE",
        "PROPOSAL_SENT",
        "PROPOSAL_REVIEW",
        "MOU_DRAFT",
        "MOU_SIGNED",
        "IN_EXECUTION",
        "MILESTONES_APPROVED",
        "COMPLETED",
        "CLOSED",
        "REJECTED",
      ],
      default: "LEAD",
    },

    // Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedDate: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: Date,

    // Comments and Collaboration
    comments: [
      {
        user: {
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

    // Documents
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        documentType: {
          type: String,
          enum: [
            "PROPOSAL",
            "MOU",
            "BUDGET",
            "PROGRESS_REPORT",
            "COMPLETION_CERTIFICATE",
            "PHOTOS",
            "OTHER",
          ],
        },
      },
    ],

    // Metadata
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes (csrId already has unique: true, so no need to index again)
csrIndustrialSchema.index({ companyName: 1 });
csrIndustrialSchema.index({ status: 1 });
csrIndustrialSchema.index({ district: 1 });
csrIndustrialSchema.index({ assignedTo: 1 });
csrIndustrialSchema.index({ createdAt: -1 });

const CSRIndustrial = mongoose.model("CSRIndustrial", csrIndustrialSchema);

export default CSRIndustrial;
