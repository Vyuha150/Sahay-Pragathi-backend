import express from "express";
import CMRelief from "../models/CMRelief.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all CM Relief requests with filters
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      status,
      reliefType,
      district,
      assignedTo,
      verificationStatus,
      urgency,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (reliefType) filter.reliefType = reliefType;
    if (district) filter.district = district;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (urgency) filter.urgency = urgency;

    const cmrfs = await CMRelief.find(filter)
      .populate("assignedTo", "firstName lastName email department")
      .populate("createdBy", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await CMRelief.countDocuments(filter);

    res.json({
      success: true,
      data: cmrfs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching CM Relief requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch CM Relief requests",
      error: error.message,
    });
  }
});

// Get CM Relief request by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    let cmrf;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      cmrf = await CMRelief.findById(id)
        .populate("assignedTo", "firstName lastName email department")
        .populate("createdBy", "firstName lastName email")
        .populate("verifiedBy", "firstName lastName email")
        .populate("approvalDetails.approvedBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName")
        .populate("comments.userId", "firstName lastName")
        .lean();
    }

    // If not found by _id or id is not ObjectId format, try cmrfId
    if (!cmrf) {
      cmrf = await CMRelief.findOne({ cmrfId: id })
        .populate("assignedTo", "firstName lastName email department")
        .populate("createdBy", "firstName lastName email")
        .populate("verifiedBy", "firstName lastName email")
        .populate("approvalDetails.approvedBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName")
        .populate("comments.userId", "firstName lastName")
        .lean();
    }

    if (!cmrf) {
      return res.status(404).json({
        success: false,
        message: "CM Relief request not found",
      });
    }

    res.json({
      success: true,
      data: cmrf,
    });
  } catch (error) {
    console.error("Error fetching CM Relief request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch CM Relief request",
      error: error.message,
    });
  }
});

// Create new CM Relief request
router.post("/", authenticate, async (req, res) => {
  try {
    const cmrfData = req.body;

    // Generate unique CMRF ID
    const cmrfId = await CMRelief.generateCMRFId(cmrfData.district);

    // Create new CM Relief request
    const cmrf = new CMRelief({
      ...cmrfData,
      cmrfId,
      createdBy: req.user.id,
      statusHistory: [
        {
          status: "REQUESTED",
          changedBy: req.user.id,
          changedAt: new Date(),
          comments: "CM Relief request created",
        },
      ],
    });

    await cmrf.save();

    // Populate references before sending response
    await cmrf.populate("assignedTo", "firstName lastName email department");
    await cmrf.populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "CM Relief request created successfully",
      data: cmrf,
    });
  } catch (error) {
    console.error("Error creating CM Relief request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create CM Relief request",
      error: error.message,
    });
  }
});

// Update CM Relief request
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let cmrf;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      cmrf = await CMRelief.findById(id);
    }

    // If not found by _id or id is not ObjectId format, try cmrfId
    if (!cmrf) {
      cmrf = await CMRelief.findOne({ cmrfId: id });
    }

    if (!cmrf) {
      return res.status(404).json({
        success: false,
        message: "CM Relief request not found",
      });
    }

    // If status is being updated, add to history
    if (updates.status && updates.status !== cmrf.status) {
      cmrf.statusHistory.push({
        status: updates.status,
        changedBy: req.user.id,
        changedAt: new Date(),
        comments: updates.statusComment || "Status updated",
      });
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== "statusComment" && updates[key] !== undefined) {
        cmrf[key] = updates[key];
      }
    });

    await cmrf.save();

    // Populate references before sending response
    await cmrf.populate("assignedTo", "firstName lastName email department");
    await cmrf.populate("createdBy", "firstName lastName email");
    await cmrf.populate("verifiedBy", "firstName lastName email");

    res.json({
      success: true,
      message: "CM Relief request updated successfully",
      data: cmrf,
    });
  } catch (error) {
    console.error("Error updating CM Relief request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update CM Relief request",
      error: error.message,
    });
  }
});

// Delete CM Relief request
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    let cmrf;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      cmrf = await CMRelief.findByIdAndDelete(id);
    }

    // If not found by _id or id is not ObjectId format, try cmrfId
    if (!cmrf) {
      cmrf = await CMRelief.findOneAndDelete({ cmrfId: id });
    }

    if (!cmrf) {
      return res.status(404).json({
        success: false,
        message: "CM Relief request not found",
      });
    }

    res.json({
      success: true,
      message: "CM Relief request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting CM Relief request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete CM Relief request",
      error: error.message,
    });
  }
});

// Add comment to CM Relief request
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    let cmrf;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      cmrf = await CMRelief.findById(id);
    }

    // If not found by _id or id is not ObjectId format, try cmrfId
    if (!cmrf) {
      cmrf = await CMRelief.findOne({ cmrfId: id });
    }

    if (!cmrf) {
      return res.status(404).json({
        success: false,
        message: "CM Relief request not found",
      });
    }

    cmrf.addComment(req.user.id, text);
    await cmrf.save();

    await cmrf.populate("comments.userId", "firstName lastName");

    res.json({
      success: true,
      message: "Comment added successfully",
      data: cmrf.comments,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
});

// Get statistics
router.get("/stats/summary", authenticate, async (req, res) => {
  try {
    const total = await CMRelief.countDocuments();
    const byStatus = await CMRelief.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const byReliefType = await CMRelief.aggregate([
      { $group: { _id: "$reliefType", count: { $sum: 1 } } },
    ]);
    const byUrgency = await CMRelief.aggregate([
      { $group: { _id: "$urgency", count: { $sum: 1 } } },
    ]);

    const totalAmountRequested = await CMRelief.aggregate([
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]);

    const totalAmountApproved = await CMRelief.aggregate([
      {
        $match: { approvedAmount: { $exists: true, $ne: null } },
      },
      { $group: { _id: null, total: { $sum: "$approvedAmount" } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        byReliefType,
        byUrgency,
        totalAmountRequested:
          totalAmountRequested.length > 0 ? totalAmountRequested[0].total : 0,
        totalAmountApproved:
          totalAmountApproved.length > 0 ? totalAmountApproved[0].total : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

export default router;
