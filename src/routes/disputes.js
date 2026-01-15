import express from "express";
import Dispute from "../models/Dispute.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all disputes with filters
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      status,
      category,
      district,
      assignedTo,
      mediator,
      hearingDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (district) filter.district = district;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (mediator) filter.mediator = mediator;
    if (hearingDate) {
      const date = new Date(hearingDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.hearingDate = { $gte: date, $lt: nextDay };
    }

    const disputes = await Dispute.find(filter)
      .populate("assignedTo", "firstName lastName email")
      .populate("mediator", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Dispute.countDocuments(filter);

    res.json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching disputes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch disputes",
      error: error.message,
    });
  }
});

// Get dispute by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id or disputeId
    const dispute = await Dispute.findOne({
      $or: [{ _id: id }, { disputeId: id }],
    })
      .populate("assignedTo", "firstName lastName email department")
      .populate("mediator", "firstName lastName email department")
      .populate("createdBy", "firstName lastName email")
      .populate("statusHistory.changedBy", "firstName lastName")
      .populate("comments.userId", "firstName lastName")
      .lean();

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Dispute not found",
      });
    }

    res.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error("Error fetching dispute:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispute",
      error: error.message,
    });
  }
});

// Create new dispute
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      partyA,
      partyB,
      category,
      description,
      incidentDate,
      incidentPlace,
      district,
      mandal,
      ward,
      pincode,
      assignedTo,
      mediator,
      hearingDate,
      hearingTime,
      hearingPlace,
      attachments,
      priority,
      tags,
    } = req.body;

    // Generate unique dispute ID
    const disputeId = await Dispute.generateDisputeId(district);

    // Create dispute
    const dispute = new Dispute({
      disputeId,
      partyA: {
        name: partyA.name,
        contact: partyA.contact,
        email: partyA.email,
        address: partyA.address,
      },
      partyB: {
        name: partyB.name,
        contact: partyB.contact,
        email: partyB.email,
        address: partyB.address,
      },
      category,
      description,
      incidentDate,
      incidentPlace,
      district,
      mandal,
      ward,
      pincode,
      assignedTo,
      mediator,
      hearingDate,
      hearingTime,
      hearingPlace,
      attachments: attachments || [],
      priority: priority || "MEDIUM",
      tags: tags || [],
      createdBy: req.user.id,
      status: "NEW",
    });

    // Calculate SLA
    const slaDuration = "7d"; // 7 days for disputes
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    dispute.sla = {
      duration: slaDuration,
      dueDate,
      status: "within-sla",
    };

    // Add initial status history
    dispute.statusHistory.push({
      status: "NEW",
      changedBy: req.user.id,
      comments: "Dispute created",
    });

    await dispute.save();

    // Populate references before sending response
    await dispute.populate("assignedTo", "firstName lastName email");
    await dispute.populate("mediator", "firstName lastName email");
    await dispute.populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Dispute created successfully",
      data: dispute,
    });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create dispute",
      error: error.message,
    });
  }
});

// Update dispute
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dispute = await Dispute.findOne({
      $or: [{ _id: id }, { disputeId: id }],
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Dispute not found",
      });
    }

    // Handle status change
    if (updates.status && updates.status !== dispute.status) {
      dispute.updateStatus(updates.status, req.user.id, updates.statusComment);
    }

    // Handle hearing scheduling
    if (updates.hearingDate) {
      dispute.scheduleHearing(
        updates.hearingDate,
        updates.hearingTime,
        updates.hearingPlace,
        updates.hearingNotes
      );
    }

    // Update other fields
    const allowedUpdates = [
      "partyA",
      "partyB",
      "category",
      "description",
      "incidentDate",
      "incidentPlace",
      "district",
      "mandal",
      "ward",
      "pincode",
      "assignedTo",
      "mediator",
      "priority",
      "tags",
      "mediationNotes",
      "settlementTerms",
      "settlementDate",
      "attachments",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        dispute[field] = updates[field];
      }
    });

    await dispute.save();

    // Populate references
    await dispute.populate("assignedTo", "firstName lastName email department");
    await dispute.populate("mediator", "firstName lastName email department");
    await dispute.populate("createdBy", "firstName lastName email");

    res.json({
      success: true,
      message: "Dispute updated successfully",
      data: dispute,
    });
  } catch (error) {
    console.error("Error updating dispute:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update dispute",
      error: error.message,
    });
  }
});

// Add comment to dispute
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const dispute = await Dispute.findOne({
      $or: [{ _id: id }, { disputeId: id }],
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Dispute not found",
      });
    }

    dispute.comments.push({
      userId: req.user.id,
      text,
    });

    await dispute.save();
    await dispute.populate("comments.userId", "firstName lastName");

    res.json({
      success: true,
      message: "Comment added successfully",
      data: dispute.comments,
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

// Delete dispute
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findOneAndDelete({
      $or: [{ _id: id }, { disputeId: id }],
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Dispute not found",
      });
    }

    res.json({
      success: true,
      message: "Dispute deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dispute:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete dispute",
      error: error.message,
    });
  }
});

export default router;
