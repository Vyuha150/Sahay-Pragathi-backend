import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    // Unique Program ID
    programId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Basic Information
    eventName: {
      type: String,
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["JOB_MELA", "PROGRAM", "TRAINING", "WORKSHOP", "SEMINAR", "OTHER"],
      default: "PROGRAM",
      index: true,
    },

    description: {
      type: String,
    },

    // Date & Time
    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    registrationStartDate: {
      type: Date,
    },

    registrationEndDate: {
      type: Date,
    },

    // Venue Information
    venue: {
      type: String,
      required: true,
      index: true,
    },

    venueAddress: {
      type: String,
    },

    venueCity: {
      type: String,
    },

    district: {
      type: String,
      index: true,
    },

    state: {
      type: String,
      default: "Andhra Pradesh",
    },

    venueCapacity: {
      type: Number,
    },

    // Partners & Organizers
    partners: [
      {
        type: String,
      },
    ],

    organizingDepartment: {
      type: String,
    },

    coordinator: {
      name: String,
      designation: String,
      contact: String,
      email: String,
    },

    // Registration & Participation
    registrations: {
      type: Number,
      default: 0,
    },

    targetParticipants: {
      type: Number,
    },

    actualParticipants: {
      type: Number,
      default: 0,
    },

    registrationFee: {
      type: Number,
      default: 0,
    },

    isRegistrationRequired: {
      type: Boolean,
      default: true,
    },

    registrationLink: {
      type: String,
    },

    // Job Mela Specific Fields
    jobMelaDetails: {
      participatingCompanies: [
        {
          companyName: String,
          industry: String,
          jobPositions: Number,
          expectedSalary: String,
          qualificationRequired: String,
          contactPerson: String,
          contactNumber: String,
          email: String,
        },
      ],
      totalJobPositions: {
        type: Number,
        default: 0,
      },
      sectors: [String], // IT, Manufacturing, Healthcare, etc.
      eligibilityCriteria: String,
      documentsRequired: [String],
    },

    // Program Details
    programDetails: {
      objectives: String,
      targetAudience: String,
      topics: [String],
      speakers: [
        {
          name: String,
          designation: String,
          organization: String,
          expertise: String,
          photoUrl: String,
        },
      ],
      agenda: [
        {
          time: String,
          session: String,
          speaker: String,
          duration: String,
        },
      ],
      certificateProvided: {
        type: Boolean,
        default: false,
      },
    },

    // Status Management
    status: {
      type: String,
      enum: [
        "PLANNED",
        "REGISTRATION",
        "REGISTRATION_CLOSED",
        "SCREENING",
        "SELECTION",
        "OFFER",
        "JOINED",
        "ONGOING",
        "COMPLETED",
        "CANCELLED",
        "POSTPONED",
      ],
      default: "PLANNED",
      index: true,
    },

    // Statistics & Results
    statistics: {
      applicationsReceived: Number,
      applicationsScreened: Number,
      candidatesShortlisted: Number,
      offersExtended: Number,
      offersAccepted: Number,
      candidatesJoined: Number,
      feedbackRating: Number,
      feedbackCount: Number,
    },

    // Budget & Finance
    budget: {
      estimatedBudget: Number,
      actualExpense: Number,
      fundingSource: String,
      sponsorships: [
        {
          sponsor: String,
          amount: Number,
          type: String, // Cash, Kind, etc.
        },
      ],
    },

    // Assignment & Management
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    assignedDate: {
      type: Date,
    },

    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: String,
        responsibilities: String,
      },
    ],

    // Verification & Approval
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedDate: {
      type: Date,
    },

    verificationNotes: {
      type: String,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedDate: {
      type: Date,
    },

    approvalNotes: {
      type: String,
    },

    cancellationReason: {
      type: String,
    },

    postponementReason: {
      type: String,
    },

    newScheduledDate: {
      type: Date,
    },

    // Communication & Marketing
    publicity: {
      posterUrl: String,
      brochureUrl: String,
      websiteUrl: String,
      socialMediaLinks: [String],
      mediaPartners: [String],
      pressReleaseIssued: Boolean,
    },

    // Attachments
    attachments: [
      {
        filename: String,
        originalName: String,
        url: String,
        fileType: String,
        documentType: {
          type: String,
          enum: [
            "PROPOSAL",
            "APPROVAL_LETTER",
            "BUDGET",
            "AGENDA",
            "BROCHURE",
            "POSTER",
            "REPORT",
            "PHOTOS",
            "ATTENDANCE",
            "FEEDBACK",
            "OTHER",
          ],
        },
        fileSize: Number,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Feedback & Follow-up
    feedback: [
      {
        participantName: String,
        participantEmail: String,
        rating: Number,
        comments: String,
        suggestions: String,
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    followUpRequired: {
      type: Boolean,
      default: true,
    },

    followUpDate: {
      type: Date,
    },

    followUpNotes: {
      type: String,
    },

    // Collaboration
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // History
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
        notes: String,
      },
    ],

    // Metadata
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    isPublic: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    tags: [String],

    internalNotes: {
      type: String,
    },

    referenceNumber: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
programSchema.index({ eventName: "text", description: "text" });
programSchema.index({ startDate: 1, endDate: 1 });
programSchema.index({ type: 1, status: 1 });
programSchema.index({ district: 1, venue: 1 });
programSchema.index({ "jobMelaDetails.sectors": 1 });

const Program = mongoose.model("Program", programSchema);

export default Program;
