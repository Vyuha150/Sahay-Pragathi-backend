import express from "express";
import Education from "../models/Education.js";

const router = express.Router();

// GET all education support requests with filters
router.get("/", async (req, res) => {
  try {
    const {
      status,
      educationType,
      supportType,
      district,
      urgency,
      assignedTo,
      verificationStatus,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (educationType) query.educationType = educationType;
    if (supportType) query.supportType = supportType;
    if (district) query.district = district;
    if (urgency) query.urgency = urgency;
    if (assignedTo) query.assignedTo = assignedTo;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const educationRequests = await Education.find(query)
      .populate("assignedTo", "firstName lastName email department")
      .populate("createdBy", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName email")
      .populate("approvalDetails.approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Education.countDocuments(query);

    res.json({
      success: true,
      data: educationRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching education support requests:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching education support requests",
      error: error.message,
    });
  }
});

// GET single education support request by ID (supports both ObjectId and educationId)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by educationId first, then by _id
    let education = await Education.findOne({ educationId: id })
      .populate("assignedTo", "firstName lastName email department")
      .populate("createdBy", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName email")
      .populate("approvalDetails.approvedBy", "firstName lastName email")
      .populate("statusHistory.changedBy", "firstName lastName email")
      .populate("comments.userId", "firstName lastName email")
      .lean();

    if (!education) {
      education = await Education.findById(id)
        .populate("assignedTo", "firstName lastName email department")
        .populate("createdBy", "firstName lastName email")
        .populate("verifiedBy", "firstName lastName email")
        .populate("approvalDetails.approvedBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName email")
        .populate("comments.userId", "firstName lastName email")
        .lean();
    }

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education support request not found",
      });
    }

    res.json({
      success: true,
      data: education,
    });
  } catch (error) {
    console.error("Error fetching education support request:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching education support request",
      error: error.message,
    });
  }
});

// CREATE new education support request
router.post("/", async (req, res) => {
  try {
    const educationData = req.body;

    // Generate unique education ID
    const educationId = await Education.generateEducationId(
      educationData.district || "GEN"
    );

    const education = new Education({
      educationId,
      ...educationData,
      createdBy: req.user?._id,
    });

    await education.save();

    // Populate references before sending response
    await education.populate(
      "assignedTo",
      "firstName lastName email department"
    );
    await education.populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Education support request created successfully",
      data: education,
    });
  } catch (error) {
    console.error("Error creating education support request:", error);
    res.status(500).json({
      success: false,
      message: "Error creating education support request",
      error: error.message,
    });
  }
});

// UPDATE education support request
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Try to find by educationId first, then by _id
    let education = await Education.findOne({ educationId: id });

    if (!education) {
      education = await Education.findById(id);
    }

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education support request not found",
      });
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== "_id" && key !== "educationId") {
        education[key] = updates[key];
      }
    });

    // If status is being updated, add to status history
    if (updates.status && updates.status !== education.status) {
      education.statusHistory.push({
        status: updates.status,
        changedBy: req.user?._id,
        changedAt: new Date(),
        comments:
          updates.statusComment || `Status changed to ${updates.status}`,
      });
    }

    await education.save();

    // Populate references
    await education.populate(
      "assignedTo",
      "firstName lastName email department"
    );
    await education.populate("createdBy", "firstName lastName email");
    await education.populate("verifiedBy", "firstName lastName email");
    await education.populate(
      "approvalDetails.approvedBy",
      "firstName lastName email"
    );

    res.json({
      success: true,
      message: "Education support request updated successfully",
      data: education,
    });
  } catch (error) {
    console.error("Error updating education support request:", error);
    res.status(500).json({
      success: false,
      message: "Error updating education support request",
      error: error.message,
    });
  }
});

// DELETE education support request
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by educationId first, then by _id
    let education = await Education.findOne({ educationId: id });

    if (!education) {
      education = await Education.findById(id);
    }

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education support request not found",
      });
    }

    await education.deleteOne();

    res.json({
      success: true,
      message: "Education support request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting education support request:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting education support request",
      error: error.message,
    });
  }
});

// ADD comment to education support request
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    // Try to find by educationId first, then by _id
    let education = await Education.findOne({ educationId: id });

    if (!education) {
      education = await Education.findById(id);
    }

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education support request not found",
      });
    }

    education.addComment(req.user?._id, text);
    await education.save();

    await education.populate("comments.userId", "firstName lastName email");

    res.json({
      success: true,
      message: "Comment added successfully",
      data: education.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message,
    });
  }
});

// GET statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const totalRequests = await Education.countDocuments();
    const byStatus = await Education.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byEducationType = await Education.aggregate([
      { $group: { _id: "$educationType", count: { $sum: 1 } } },
    ]);
    const bySupportType = await Education.aggregate([
      { $group: { _id: "$supportType", count: { $sum: 1 } } },
    ]);

    const totalAmountRequested = await Education.aggregate([
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]);

    const totalAmountApproved = await Education.aggregate([
      {
        $match: { approvedAmount: { $exists: true, $ne: null } },
      },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalRequests,
        byStatus,
        byEducationType,
        bySupportType,
        totalAmountRequested: totalAmountRequested[0]?.total || 0,
        totalAmountApproved: totalAmountApproved[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

export default router;
