import express from "express";
import Emergency from "../models/Emergency.js";

const router = express.Router();

// Get all emergencies
router.get("/", async (req, res) => {
  try {
    const {
      status,
      emergencyType,
      urgency,
      assignedTo,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (emergencyType) query.emergencyType = emergencyType;
    if (urgency) query.urgency = urgency;
    if (assignedTo) query.assignedTo = assignedTo;

    const emergencies = await Emergency.find(query)
      .populate("assignedTo", "firstName lastName email")
      .populate("closedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Emergency.countDocuments(query);

    res.json({
      success: true,
      data: emergencies,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching emergencies",
      error: error.message,
    });
  }
});

// Get emergency by ID
router.get("/:id", async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate("assignedTo", "firstName lastName email phone")
      .populate("escalatedTo", "firstName lastName email")
      .populate("closedBy", "firstName lastName");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    res.json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching emergency",
      error: error.message,
    });
  }
});

// Create new emergency
router.post("/", async (req, res) => {
  try {
    const emergency = new Emergency(req.body);
    await emergency.save();

    res.status(201).json({
      success: true,
      data: emergency,
      message: "Emergency logged successfully",
    });
  } catch (error) {
    console.error("Error creating emergency:", error);
    res.status(400).json({
      success: false,
      message: "Error creating emergency",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : undefined,
    });
  }
});

// Update emergency
router.put("/:id", async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    res.json({
      success: true,
      data: emergency,
      message: "Emergency updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating emergency",
      error: error.message,
    });
  }
});

// Delete emergency
router.delete("/:id", async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndDelete(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    res.json({
      success: true,
      message: "Emergency deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting emergency",
      error: error.message,
    });
  }
});

// Assign emergency to user
router.patch("/:id/assign", async (req, res) => {
  try {
    const { assignedTo, priority } = req.body;

    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo,
        priority,
        status: "DISPATCHED",
      },
      { new: true }
    ).populate("assignedTo", "firstName lastName email");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    res.json({
      success: true,
      data: emergency,
      message: "Emergency assigned successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error assigning emergency",
      error: error.message,
    });
  }
});

// Update emergency status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, actionTaken, closureNotes, closedBy } = req.body;

    const updateData = { status };
    if (actionTaken) updateData.actionTaken = actionTaken;

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolutionTime = new Date();
      if (closureNotes) updateData.closureNotes = closureNotes;
      if (closedBy) {
        updateData.closedBy = closedBy;
        updateData.closedAt = new Date();
      }
    }

    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    res.json({
      success: true,
      data: emergency,
      message: "Emergency status updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating emergency status",
      error: error.message,
    });
  }
});

// Escalate emergency
router.patch("/:id/escalate", async (req, res) => {
  try {
    const { escalatedTo, escalationReason } = req.body;

    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      {
        escalated: true,
        escalatedTo,
        escalationReason,
        escalationDate: new Date(),
        priority: "CRITICAL",
      },
      { new: true }
    ).populate("escalatedTo", "firstName lastName email");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    res.json({
      success: true,
      data: emergency,
      message: "Emergency escalated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error escalating emergency",
      error: error.message,
    });
  }
});

// Get emergency statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const stats = await Emergency.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStats = await Emergency.aggregate([
      {
        $group: {
          _id: "$emergencyType",
          count: { $sum: 1 },
        },
      },
    ]);

    const urgencyStats = await Emergency.aggregate([
      {
        $group: {
          _id: "$urgency",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        byType: typeStats,
        byUrgency: urgencyStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

export default router;
