import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // Unique ID
    appointmentId: {
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

    // Appointment Details
    purpose: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "PERSONAL_GRIEVANCE",
        "PROJECT_DISCUSSION",
        "COMMUNITY_ISSUE",
        "BUSINESS_PROPOSAL",
        "GENERAL_MEETING",
        "VIP_MEETING",
        "OTHER",
      ],
      default: "GENERAL_MEETING",
    },
    detailedDescription: String,
    urgency: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    // Preferred Schedule
    preferredDate: Date,
    preferredTime: String,
    alternativeDate: Date,
    alternativeTime: String,
    duration: Number, // in minutes

    // Confirmed Appointment
    confirmedDate: Date,
    confirmedTime: String,
    confirmedSlot: Date, // Combined date-time
    meetingPlace: {
      type: String,
      enum: [
        "CHIEF_MINISTER_OFFICE",
        "SECRETARIAT",
        "DISTRICT_COLLECTORATE",
        "FIELD_VISIT",
        "VIRTUAL_MEETING",
        "OTHER",
      ],
    },
    specificLocation: String,
    meetingRoom: String,

    // Official Assignment
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedDate: Date,
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Status
    status: {
      type: String,
      required: true,
      enum: [
        "REQUESTED",
        "UNDER_REVIEW",
        "CONFIRMED",
        "RESCHEDULED",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
        "REJECTED",
      ],
      default: "REQUESTED",
    },

    // Meeting Details
    attendees: [String],
    agenda: String,
    meetingNotes: String,
    actionItems: [
      {
        item: String,
        assignedTo: String,
        dueDate: Date,
        status: {
          type: String,
          enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
          default: "PENDING",
        },
      },
    ],

    // Check-in/Check-out
    checkInTime: Date,
    checkOutTime: Date,
    actualDuration: Number, // in minutes

    // Follow-up
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    followUpNotes: String,

    // Verification
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedDate: Date,
    verificationNotes: String,

    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedDate: Date,
    approvalNotes: String,
    rejectionReason: String,
    cancellationReason: String,

    // Communication
    confirmationSent: {
      type: Boolean,
      default: false,
    },
    confirmationSentDate: Date,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentDate: Date,

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
            "REQUEST_LETTER",
            "IDENTITY_PROOF",
            "SUPPORTING_DOCUMENTS",
            "MEETING_MINUTES",
            "FOLLOW_UP_DOCUMENTS",
            "OTHER",
          ],
        },
      },
    ],

    // Status History
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
      enum: ["LOW", "MEDIUM", "HIGH", "VIP"],
      default: "MEDIUM",
    },
    isVIP: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes (appointmentId already has unique: true, so no need to index again)
appointmentSchema.index({ applicantName: 1 });
appointmentSchema.index({ mobile: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ preferredDate: 1 });
appointmentSchema.index({ confirmedDate: 1 });
appointmentSchema.index({ assignedTo: 1 });
appointmentSchema.index({ createdAt: -1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
