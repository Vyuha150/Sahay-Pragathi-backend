import express from "express";
import CSRIndustrial from "../models/CSRIndustrial.js";

const router = express.Router();

// GET all CSR Industrial projects with filters
router.get("/", async (req, res) => {
  try {
    const {
      status,
      companyName,
      projectCategory,
      district,
      assignedTo,
      dueDiligenceStatus,
      priority,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (companyName) query.companyName = new RegExp(companyName, "i");
    if (projectCategory) query.projectCategory = projectCategory;
    if (district) query.district = district;
    if (assignedTo) query.assignedTo = assignedTo;
    if (dueDiligenceStatus) query.dueDiligenceStatus = dueDiligenceStatus;
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const csrProjects = await CSRIndustrial.find(query)
      .populate("assignedTo", "firstName lastName email department")
      .populate("reviewedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("dueDiligenceCompletedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await CSRIndustrial.countDocuments(query);

    res.json({
      success: true,
      data: csrProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching CSR projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching CSR projects",
      error: error.message,
    });
  }
});

// GET single CSR project by ID (supports both ObjectId and csrId)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id })
      .populate("assignedTo", "firstName lastName email department")
      .populate("reviewedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("dueDiligenceCompletedBy", "firstName lastName email")
      .populate("comments.user", "firstName lastName email")
      .lean();

    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id)
        .populate("assignedTo", "firstName lastName email department")
        .populate("reviewedBy", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("dueDiligenceCompletedBy", "firstName lastName email")
        .populate("comments.user", "firstName lastName email")
        .lean();
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    res.json({
      success: true,
      data: csrProject,
    });
  } catch (error) {
    console.error("Error fetching CSR project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching CSR project",
      error: error.message,
    });
  }
});

// POST create new CSR project
router.post("/", async (req, res) => {
  try {
    // Generate unique CSR ID
    const count = await CSRIndustrial.countDocuments();
    const csrId = `CSR-AP-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(6, "0")}`;

    const csrProject = new CSRIndustrial({
      ...req.body,
      csrId,
    });

    await csrProject.save();

    res.status(201).json({
      success: true,
      message: "CSR project created successfully",
      data: csrProject,
    });
  } catch (error) {
    console.error("Error creating CSR project:", error);
    res.status(500).json({
      success: false,
      message: "Error creating CSR project",
      error: error.message,
    });
  }
});

// PUT update CSR project
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "csrId" && key !== "_id") {
        csrProject[key] = req.body[key];
      }
    });

    await csrProject.save();

    res.json({
      success: true,
      message: "CSR project updated successfully",
      data: csrProject,
    });
  } catch (error) {
    console.error("Error updating CSR project:", error);
    res.status(500).json({
      success: false,
      message: "Error updating CSR project",
      error: error.message,
    });
  }
});

// PATCH update CSR project status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    csrProject.status = status;
    if (notes) {
      csrProject.progressNotes = notes;
    }

    await csrProject.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      data: csrProject,
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

// PATCH assign CSR project
router.patch("/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    csrProject.assignedTo = assignedTo;
    csrProject.assignedDate = new Date();

    await csrProject.save();

    const populated = await CSRIndustrial.findById(csrProject._id).populate(
      "assignedTo",
      "firstName lastName email department"
    );

    res.json({
      success: true,
      message: "Project assigned successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error assigning project:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning project",
      error: error.message,
    });
  }
});

// POST add comment to CSR project
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { user, text } = req.body;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    csrProject.comments.push({
      user,
      text,
      createdAt: new Date(),
    });

    await csrProject.save();

    const populated = await CSRIndustrial.findById(csrProject._id).populate(
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

// POST add milestone to CSR project
router.post("/:id/milestones", async (req, res) => {
  try {
    const { id } = req.params;
    const milestone = req.body;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    csrProject.milestones.push(milestone);
    await csrProject.save();

    res.json({
      success: true,
      message: "Milestone added successfully",
      data: csrProject,
    });
  } catch (error) {
    console.error("Error adding milestone:", error);
    res.status(500).json({
      success: false,
      message: "Error adding milestone",
      error: error.message,
    });
  }
});

// PATCH update milestone status
router.patch("/:id/milestones/:milestoneId", async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const updates = req.body;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    const milestone = csrProject.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    Object.keys(updates).forEach((key) => {
      milestone[key] = updates[key];
    });

    await csrProject.save();

    res.json({
      success: true,
      message: "Milestone updated successfully",
      data: csrProject,
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    res.status(500).json({
      success: false,
      message: "Error updating milestone",
      error: error.message,
    });
  }
});

// GET CSR statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalProjects = await CSRIndustrial.countDocuments();
    const activeProjects = await CSRIndustrial.countDocuments({
      status: { $in: ["IN_EXECUTION", "MOU_SIGNED"] },
    });
    const completedProjects = await CSRIndustrial.countDocuments({
      status: "COMPLETED",
    });

    const totalBudgetResult = await CSRIndustrial.aggregate([
      { $match: { status: { $ne: "REJECTED" } } },
      { $group: { _id: null, total: { $sum: "$proposedBudget" } } },
    ]);

    const approvedBudgetResult = await CSRIndustrial.aggregate([
      { $match: { approvedBudget: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: "$approvedBudget" } } },
    ]);

    const statusDistribution = await CSRIndustrial.aggregate([
      { $group: { _id: "$status", count: { $count: {} } } },
    ]);

    const categoryDistribution = await CSRIndustrial.aggregate([
      { $group: { _id: "$projectCategory", count: { $count: {} } } },
    ]);

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalBudget: totalBudgetResult[0]?.total || 0,
        approvedBudget: approvedBudgetResult[0]?.total || 0,
        statusDistribution,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching CSR statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

// DELETE CSR project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by csrId first, then by _id
    let csrProject = await CSRIndustrial.findOne({ csrId: id });
    if (!csrProject) {
      csrProject = await CSRIndustrial.findById(id);
    }

    if (!csrProject) {
      return res.status(404).json({
        success: false,
        message: "CSR project not found",
      });
    }

    await csrProject.deleteOne();

    res.json({
      success: true,
      message: "CSR project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting CSR project:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting CSR project",
      error: error.message,
    });
  }
});

export default router;
