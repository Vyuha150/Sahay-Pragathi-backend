import express from "express";
import Program from "../models/Program.js";

const router = express.Router();

// GET all programs with filters
router.get("/", async (req, res) => {
  try {
    const {
      status,
      type,
      venue,
      district,
      assignedTo,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (venue) query.venue = venue;
    if (district) query.district = district;
    if (assignedTo) query.assignedTo = assignedTo;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const programs = await Program.find(query)
      .populate("assignedTo", "firstName lastName email department")
      .populate("verifiedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("teamMembers.user", "firstName lastName email")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Program.countDocuments(query);

    res.json({
      success: true,
      data: programs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching programs",
      error: error.message,
    });
  }
});

// GET single program by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let program = await Program.findOne({ programId: id })
      .populate("assignedTo", "firstName lastName email department")
      .populate("verifiedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("teamMembers.user", "firstName lastName email")
      .populate("comments.user", "firstName lastName email")
      .populate("statusHistory.changedBy", "firstName lastName email")
      .lean();

    if (!program) {
      program = await Program.findById(id)
        .populate("assignedTo", "firstName lastName email department")
        .populate("verifiedBy", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("teamMembers.user", "firstName lastName email")
        .populate("comments.user", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName email")
        .lean();
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    res.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error("Error fetching program:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching program",
      error: error.message,
    });
  }
});

// POST create new program
router.post("/", async (req, res) => {
  try {
    const count = await Program.countDocuments();
    const programId = `PRG-AP-NLR-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(6, "0")}`;

    const program = new Program({
      ...req.body,
      programId,
    });

    await program.save();

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      data: program,
    });
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({
      success: false,
      message: "Error creating program",
      error: error.message,
    });
  }
});

// PUT update program
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    Object.keys(req.body).forEach((key) => {
      if (key !== "programId" && key !== "_id") {
        program[key] = req.body[key];
      }
    });

    await program.save();

    res.json({
      success: true,
      message: "Program updated successfully",
      data: program,
    });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({
      success: false,
      message: "Error updating program",
      error: error.message,
    });
  }
});

// PATCH update status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, changedBy } = req.body;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.status = status;
    program.statusHistory.push({
      status,
      changedBy,
      changedAt: new Date(),
      notes,
    });

    await program.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      data: program,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
});

// PATCH assign
router.patch("/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.assignedTo = assignedTo;
    program.assignedDate = new Date();

    await program.save();

    const populated = await Program.findById(program._id).populate(
      "assignedTo",
      "firstName lastName email department"
    );

    res.json({
      success: true,
      message: "Program assigned successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error assigning program:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning program",
      error: error.message,
    });
  }
});

// POST add comment
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { user, text } = req.body;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.comments.push({
      user,
      text,
      createdAt: new Date(),
    });

    await program.save();

    const populated = await Program.findById(program._id).populate(
      "comments.user",
      "firstName lastName email"
    );

    res.json({
      success: true,
      message: "Comment added successfully",
      data: populated,
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

// POST add team member
router.post("/:id/team-members", async (req, res) => {
  try {
    const { id } = req.params;
    const { user, role, responsibilities } = req.body;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.teamMembers.push({
      user,
      role,
      responsibilities,
    });

    await program.save();

    const populated = await Program.findById(program._id).populate(
      "teamMembers.user",
      "firstName lastName email"
    );

    res.json({
      success: true,
      message: "Team member added successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({
      success: false,
      message: "Error adding team member",
      error: error.message,
    });
  }
});

// POST add feedback
router.post("/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const feedbackData = req.body;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    program.feedback.push(feedbackData);

    // Update statistics
    if (!program.statistics) {
      program.statistics = {};
    }
    program.statistics.feedbackCount = program.feedback.length;
    const totalRating = program.feedback.reduce(
      (sum, f) => sum + (f.rating || 0),
      0
    );
    program.statistics.feedbackRating = totalRating / program.feedback.length;

    await program.save();

    res.json({
      success: true,
      message: "Feedback added successfully",
      data: program,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error adding feedback",
      error: error.message,
    });
  }
});

// GET statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalPrograms = await Program.countDocuments();
    const upcomingPrograms = await Program.countDocuments({
      startDate: { $gte: new Date() },
      status: { $nin: ["COMPLETED", "CANCELLED"] },
    });
    const ongoingPrograms = await Program.countDocuments({
      status: "ONGOING",
    });
    const completedPrograms = await Program.countDocuments({
      status: "COMPLETED",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeekPrograms = await Program.countDocuments({
      startDate: {
        $gte: today,
        $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const statusDistribution = await Program.aggregate([
      { $group: { _id: "$status", count: { $count: {} } } },
    ]);

    const typeDistribution = await Program.aggregate([
      { $group: { _id: "$type", count: { $count: {} } } },
    ]);

    const venueDistribution = await Program.aggregate([
      { $group: { _id: "$venue", count: { $count: {} } } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalPrograms,
        upcomingPrograms,
        ongoingPrograms,
        completedPrograms,
        thisWeekPrograms,
        statusDistribution,
        typeDistribution,
        venueDistribution,
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

// DELETE program
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let program = await Program.findOne({ programId: id });
    if (!program) {
      program = await Program.findById(id);
    }

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    await program.deleteOne();

    res.json({
      success: true,
      message: "Program deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting program",
      error: error.message,
    });
  }
});

export default router;
