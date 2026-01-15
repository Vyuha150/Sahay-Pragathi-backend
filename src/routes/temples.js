import express from "express";
import Temple from "../models/Temple.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all temple letters with filters
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      status,
      templeName,
      darshanType,
      district,
      assignedTo,
      preferredDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (templeName) filter.templeName = templeName;
    if (darshanType) filter.darshanType = darshanType;
    if (district) filter.district = district;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (preferredDate) {
      const date = new Date(preferredDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.preferredDate = { $gte: date, $lt: nextDay };
    }

    const temples = await Temple.find(filter)
      .populate("assignedTo", "firstName lastName email department")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Temple.countDocuments(filter);

    res.json({
      success: true,
      data: temples,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching temple letters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch temple letters",
      error: error.message,
    });
  }
});

// Get temple letter by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    let temple;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      // Try to find by MongoDB _id
      temple = await Temple.findById(id)
        .populate("assignedTo", "firstName lastName email department")
        .populate("createdBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName")
        .populate("comments.userId", "firstName lastName")
        .lean();
    }

    // If not found by _id or id is not ObjectId format, try templeId
    if (!temple) {
      temple = await Temple.findOne({ templeId: id })
        .populate("assignedTo", "firstName lastName email department")
        .populate("createdBy", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName")
        .populate("comments.userId", "firstName lastName")
        .lean();
    }

    if (!temple) {
      return res.status(404).json({
        success: false,
        message: "Temple letter not found",
      });
    }

    res.json({
      success: true,
      data: temple,
    });
  } catch (error) {
    console.error("Error fetching temple letter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch temple letter",
      error: error.message,
    });
  }
});

// Create new temple letter
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      applicantName,
      mobile,
      email,
      address,
      aadhaarNumber,
      templeName,
      darshanType,
      preferredDate,
      numberOfPeople,
      district,
      mandal,
      ward,
      pincode,
      purpose,
      remarks,
      assignedTo,
      attachments,
      tags,
    } = req.body;

    // Generate unique temple ID
    const templeId = await Temple.generateTempleId(district);

    // Create temple letter
    const temple = new Temple({
      templeId,
      applicantName,
      mobile,
      email,
      address,
      aadhaarNumber,
      templeName,
      darshanType,
      preferredDate,
      numberOfPeople: numberOfPeople || 1,
      district,
      mandal,
      ward,
      pincode,
      purpose,
      remarks,
      assignedTo,
      attachments: attachments || [],
      tags: tags || [],
      createdBy: req.user.id,
      status: "REQUESTED",
    });

    // Add initial status to history
    temple.statusHistory.push({
      status: "REQUESTED",
      changedBy: req.user.id,
      changedAt: new Date(),
      comments: "Temple letter request created",
    });

    await temple.save();

    res.status(201).json({
      success: true,
      message: "Temple letter created successfully",
      data: temple,
      temple_id: temple.templeId,
    });
  } catch (error) {
    console.error("Error creating temple letter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create temple letter",
      error: error.message,
    });
  }
});

// Update temple letter
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let temple;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      temple = await Temple.findById(id);
    }

    // If not found by _id or id is not ObjectId format, try templeId
    if (!temple) {
      temple = await Temple.findOne({ templeId: id });
    }

    if (!temple) {
      return res.status(404).json({
        success: false,
        message: "Temple letter not found",
      });
    }

    // If status is being updated, add to history
    if (updates.status && updates.status !== temple.status) {
      temple.statusHistory.push({
        status: updates.status,
        changedBy: req.user.id,
        changedAt: new Date(),
        comments: updates.statusComment || "Status updated",
      });
    }

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== "statusComment" && updates[key] !== undefined) {
        temple[key] = updates[key];
      }
    });

    await temple.save();

    // Populate references before sending response
    await temple.populate("assignedTo", "firstName lastName email department");
    await temple.populate("createdBy", "firstName lastName email");

    res.json({
      success: true,
      message: "Temple letter updated successfully",
      data: temple,
    });
  } catch (error) {
    console.error("Error updating temple letter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update temple letter",
      error: error.message,
    });
  }
});

// Delete temple letter
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    let temple;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      temple = await Temple.findByIdAndDelete(id);
    }

    // If not found by _id or id is not ObjectId format, try templeId
    if (!temple) {
      temple = await Temple.findOneAndDelete({ templeId: id });
    }

    if (!temple) {
      return res.status(404).json({
        success: false,
        message: "Temple letter not found",
      });
    }

    res.json({
      success: true,
      message: "Temple letter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting temple letter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete temple letter",
      error: error.message,
    });
  }
});

// Add comment to temple letter
router.post("/:id/comments", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    let temple;

    // Check if id is a valid MongoDB ObjectId (24 hex characters)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      temple = await Temple.findById(id);
    }

    // If not found by _id or id is not ObjectId format, try templeId
    if (!temple) {
      temple = await Temple.findOne({ templeId: id });
    }

    if (!temple) {
      return res.status(404).json({
        success: false,
        message: "Temple letter not found",
      });
    }

    temple.addComment(req.user.id, text);
    await temple.save();

    await temple.populate("comments.userId", "firstName lastName");

    res.json({
      success: true,
      message: "Comment added successfully",
      data: temple.comments,
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
    const { templeName, startDate, endDate } = req.query;

    const filter = {};
    if (templeName) filter.templeName = templeName;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalRequests,
      approved,
      rejected,
      pending,
      byDarshanType,
      byTemple,
    ] = await Promise.all([
      Temple.countDocuments(filter),
      Temple.countDocuments({ ...filter, status: "APPROVED" }),
      Temple.countDocuments({ ...filter, status: "REJECTED" }),
      Temple.countDocuments({
        ...filter,
        status: { $in: ["REQUESTED", "UNDER_REVIEW"] },
      }),
      Temple.aggregate([
        { $match: filter },
        { $group: { _id: "$darshanType", count: { $sum: 1 } } },
      ]),
      Temple.aggregate([
        { $match: filter },
        { $group: { _id: "$templeName", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalRequests,
        approved,
        rejected,
        pending,
        byDarshanType,
        byTemple,
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
