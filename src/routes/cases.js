import express from "express";
import Case from "../models/Case.js";

const router = express.Router();

// Get all cases with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const {
      status,
      department,
      district,
      priority,
      caseType,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build filter query
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (district) filter.district = district;
    if (priority) filter.priority = priority;
    if (caseType) filter.caseType = caseType;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;

    // Execute query
    const cases = await Case.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("assignedTo", "firstName lastName email department")
      .populate("createdBy", "firstName lastName email");

    const total = await Case.countDocuments(filter);

    res.json({
      success: true,
      data: cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get single case by ID (supports both MongoDB _id and caseId)
router.get("/:id", async (req, res) => {
  try {
    let caseData;

    // Try to find by MongoDB _id first
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      caseData = await Case.findById(req.params.id)
        .populate(
          "assignedTo",
          "firstName lastName email department designation"
        )
        .populate("createdBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName")
        .populate("comments.userId", "firstName lastName");
    } else {
      // If not a valid ObjectId, try to find by caseId
      caseData = await Case.findOne({ caseId: req.params.id })
        .populate(
          "assignedTo",
          "firstName lastName email department designation"
        )
        .populate("createdBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName")
        .populate("comments.userId", "firstName lastName");
    }

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    res.json({
      success: true,
      data: caseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create new case
router.post("/", async (req, res) => {
  try {
    // Support both formats:
    // 1. New format: { module, details, assignment }
    // 2. Direct format: { caseType, citizenName, ... } from forms
    let module, details, assignment;

    if (req.body.module && req.body.details) {
      // New task wizard format
      module = req.body.module;
      details = req.body.details;
      assignment = req.body.assignment || {};
    } else {
      // Direct form submission format (from GrievanceForm, etc.)
      module = req.body.caseType || "grievance";
      details = req.body;
      assignment = {};
    }

    // Calculate SLA due date based on duration
    const calculateDueDate = (slaDuration) => {
      const now = new Date();
      if (!slaDuration) return null;
      const match = slaDuration.match(/(\d+)([hd])/);
      if (!match) return null;
      if (!match) return now;

      const value = parseInt(match[1]);
      const unit = match[2];

      if (unit === "h") {
        now.setHours(now.getHours() + value);
      } else if (unit === "d") {
        now.setDate(now.getDate() + value);
      }
      return now;
    };

    // Generate case ID
    const count = await Case.countDocuments();
    const caseId = `CASE-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(6, "0")}`;

    // Prepare case data
    const caseData = {
      caseId,
      caseType: module,
      subject: details.subject || details.reason || "New Task",
      description: details.description || "",
      reason: details.reason,
      place: details.place,
      time: details.time ? new Date(details.time) : null,

      // Common citizen info
      citizenName:
        details.citizenName ||
        details.applicantName ||
        details.patientName ||
        details.studentName ||
        "N/A",
      citizenContact: details.citizenContact || {
        phone: details.mobile || details.phone,
        email: details.email,
        address: details.address || details.place,
      },

      // Location details
      district: details.district,
      mandal: details.mandal,
      ward: details.ward,
      pincode: details.pincode,

      // Module-specific fields
      ...(module === "grievance" && {
        category: details.category,
        mobile: details.mobile || details.phone,
        department: details.department,
        priority: details.priority,
      }),
      ...(module === "dispute" && {
        partyA: details.partyA,
        partyB: details.partyB,
        disputeCategory: details.disputeCategory,
      }),
      ...(module === "temple" && {
        applicantName: details.applicantName,
        templeId: details.templeId,
        darshanType: details.darshanType,
        preferredDate: details.preferredDate
          ? new Date(details.preferredDate)
          : null,
      }),
      ...(module === "cmr" && {
        patientName: details.patientName,
        ailment: details.ailment,
        hospitalName: details.hospitalName,
        estimatedAmount: details.estimatedAmount,
      }),
      ...(module === "education" && {
        studentName: details.studentName,
        courseDetails: details.courseDetails,
        institutionName: details.institutionName,
      }),
      ...(module === "csr" && {
        companyName: details.companyName,
        projectTitle: details.projectTitle,
        proposedBudget: details.proposedBudget,
      }),
      ...(module === "appointment" && {
        appointmentDate: details.appointmentDate
          ? new Date(details.appointmentDate)
          : null,
        appointmentTime: details.appointmentTime,
        purposeOfVisit: details.purposeOfVisit,
      }),
      ...(module === "program" && {
        programType: details.programType,
        venue: details.venue,
        expectedAttendees: details.expectedAttendees,
      }),

      // Assignment details
      assignedTo: assignment?.assignedTo || null, // Make it optional
      department: details.department || assignment?.department || "General",
      priority: details.priority || assignment?.priority || "P3",
      assignmentNotes: assignment?.notes,

      // SLA
      sla: {
        duration: assignment?.sla,
        dueDate: assignment?.sla ? calculateDueDate(assignment.sla) : null,
        status: "within-sla",
      },

      // Attachments - handle both array of strings (URLs) and array of objects
      attachments: Array.isArray(details.attachments)
        ? details.attachments
            .map((att) => {
              if (typeof att === "string") {
                // If it's just a URL string
                const filename = att.split("/").pop() || "file";
                return {
                  filename,
                  url: att,
                  uploadedAt: new Date(),
                };
              } else if (att && typeof att === "object") {
                // If it's already an object
                return {
                  filename: att.filename || att.name || "file",
                  url: att.url,
                  uploadedAt: att.uploadedAt || new Date(),
                };
              }
              return null;
            })
            .filter(Boolean)
        : [],

      // Initial status
      status: details.status || "pending",

      // Track who created it
      createdBy: req.user?.id, // If auth middleware is applied
    };

    const newCase = new Case(caseData);
    await newCase.save();

    // Populate references before sending response
    await newCase.populate("assignedTo", "firstName lastName email");
    await newCase.populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      data: newCase,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Error creating case:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update case
router.put("/:id", async (req, res) => {
  try {
    let caseData;

    // Try to find by MongoDB _id first
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      caseData = await Case.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    } else {
      // If not a valid ObjectId, try to find by caseId
      caseData = await Case.findOneAndUpdate(
        { caseId: req.params.id },
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    // Populate references
    await caseData.populate(
      "assignedTo",
      "firstName lastName email department"
    );
    await caseData.populate("createdBy", "firstName lastName email");

    res.json({
      success: true,
      data: caseData,
      message: "Case updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Update case status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, userId, comments } = req.body;

    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    await caseData.updateStatus(status, userId, comments);

    res.json({
      success: true,
      data: caseData,
      message: "Case status updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Add comment to case
router.post("/:id/comments", async (req, res) => {
  try {
    const { userId, text } = req.body;

    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    await caseData.addComment(userId, text);

    res.json({
      success: true,
      data: caseData,
      message: "Comment added successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get case statistics
router.get("/stats/dashboard", async (req, res) => {
  try {
    const { department, district } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (district) filter.district = district;

    const [
      totalCases,
      pendingCases,
      inProgressCases,
      completedCases,
      breachedSLA,
    ] = await Promise.all([
      Case.countDocuments(filter),
      Case.countDocuments({ ...filter, status: "pending" }),
      Case.countDocuments({ ...filter, status: "in-progress" }),
      Case.countDocuments({ ...filter, status: "completed" }),
      Case.countDocuments({ ...filter, "sla.status": "breached" }),
    ]);

    res.json({
      success: true,
      data: {
        totalCases,
        pendingCases,
        inProgressCases,
        completedCases,
        breachedSLA,
        slaCompliance:
          totalCases > 0
            ? (((totalCases - breachedSLA) / totalCases) * 100).toFixed(2)
            : 100,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete case (soft delete - update status to closed)
router.delete("/:id", async (req, res) => {
  try {
    const caseData = await Case.findByIdAndUpdate(
      req.params.id,
      { status: "closed" },
      { new: true }
    );

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    res.json({
      success: true,
      message: "Case closed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
