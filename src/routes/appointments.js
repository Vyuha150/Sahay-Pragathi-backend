import express from "express";
import Appointment from "../models/Appointment.js";

const router = express.Router();

// GET all appointments with filters
router.get("/", async (req, res) => {
  try {
    const {
      status,
      category,
      meetingPlace,
      district,
      assignedTo,
      priority,
      isVIP,
      confirmedDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (meetingPlace) query.meetingPlace = meetingPlace;
    if (district) query.district = district;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (isVIP === "true") query.isVIP = true;
    if (confirmedDate) {
      const date = new Date(confirmedDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.confirmedDate = { $gte: date, $lt: nextDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate("assignedTo", "firstName lastName email department")
      .populate("coordinator", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message,
    });
  }
});

// GET single appointment by ID (supports both ObjectId and appointmentId)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id })
      .populate("assignedTo", "firstName lastName email department")
      .populate("coordinator", "firstName lastName email")
      .populate("verifiedBy", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("comments.user", "firstName lastName email")
      .populate("statusHistory.changedBy", "firstName lastName email")
      .lean();

    if (!appointment) {
      appointment = await Appointment.findById(id)
        .populate("assignedTo", "firstName lastName email department")
        .populate("coordinator", "firstName lastName email")
        .populate("verifiedBy", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("comments.user", "firstName lastName email")
        .populate("statusHistory.changedBy", "firstName lastName email")
        .lean();
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointment",
      error: error.message,
    });
  }
});

// POST create new appointment
router.post("/", async (req, res) => {
  try {
    // Generate unique appointment ID
    const count = await Appointment.countDocuments();
    const appointmentId = `APP-AP-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(6, "0")}`;

    const appointment = new Appointment({
      ...req.body,
      appointmentId,
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating appointment",
      error: error.message,
    });
  }
});

// PUT update appointment
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "appointmentId" && key !== "_id") {
        appointment[key] = req.body[key];
      }
    });

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment",
      error: error.message,
    });
  }
});

// PATCH update appointment status
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, changedBy } = req.body;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Update status
    appointment.status = status;

    // Add to status history
    appointment.statusHistory.push({
      status,
      changedBy,
      changedAt: new Date(),
      notes,
    });

    await appointment.save();

    res.json({
      success: true,
      message: "Status updated successfully",
      data: appointment,
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

// PATCH assign appointment
router.patch("/:id/assign", async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, coordinator } = req.body;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (assignedTo) {
      appointment.assignedTo = assignedTo;
      appointment.assignedDate = new Date();
    }
    if (coordinator) {
      appointment.coordinator = coordinator;
    }

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate("assignedTo", "firstName lastName email department")
      .populate("coordinator", "firstName lastName email");

    res.json({
      success: true,
      message: "Appointment assigned successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Error assigning appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning appointment",
      error: error.message,
    });
  }
});

// PATCH confirm appointment
router.patch("/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedDate, confirmedTime, meetingPlace, specificLocation } =
      req.body;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.confirmedDate = confirmedDate;
    appointment.confirmedTime = confirmedTime;
    appointment.meetingPlace = meetingPlace;
    appointment.specificLocation = specificLocation;
    appointment.status = "CONFIRMED";
    appointment.confirmationSent = true;
    appointment.confirmationSentDate = new Date();

    // Create combined confirmedSlot
    if (confirmedDate && confirmedTime) {
      const [hours, minutes] = confirmedTime.split(":");
      const slotDate = new Date(confirmedDate);
      slotDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      appointment.confirmedSlot = slotDate;
    }

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment confirmed successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error confirming appointment",
      error: error.message,
    });
  }
});

// PATCH check-in
router.patch("/:id/checkin", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.checkInTime = new Date();
    appointment.status = "CHECKED_IN";

    await appointment.save();

    res.json({
      success: true,
      message: "Checked in successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error checking in:", error);
    res.status(500).json({
      success: false,
      message: "Error checking in",
      error: error.message,
    });
  }
});

// POST add comment
router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { user, text } = req.body;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.comments.push({
      user,
      text,
      createdAt: new Date(),
    });

    await appointment.save();

    const populated = await Appointment.findById(appointment._id).populate(
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

// GET appointment statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const confirmedAppointments = await Appointment.countDocuments({
      status: "CONFIRMED",
    });
    const completedAppointments = await Appointment.countDocuments({
      status: "COMPLETED",
    });
    const pendingAppointments = await Appointment.countDocuments({
      status: { $in: ["REQUESTED", "UNDER_REVIEW"] },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await Appointment.countDocuments({
      confirmedDate: { $gte: today, $lt: tomorrow },
    });

    const statusDistribution = await Appointment.aggregate([
      { $group: { _id: "$status", count: { $count: {} } } },
    ]);

    const categoryDistribution = await Appointment.aggregate([
      { $group: { _id: "$category", count: { $count: {} } } },
    ]);

    res.json({
      success: true,
      data: {
        totalAppointments,
        confirmedAppointments,
        completedAppointments,
        pendingAppointments,
        todaysAppointments,
        statusDistribution,
        categoryDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

// DELETE appointment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by appointmentId first, then by _id
    let appointment = await Appointment.findOne({ appointmentId: id });
    if (!appointment) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await appointment.deleteOne();

    res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting appointment",
      error: error.message,
    });
  }
});

export default router;
