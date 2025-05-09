const User = require('../models/user.model');

/**
 * Get all court owners with pending approval
 */
const getPendingCourtOwners = async (req, res) => {
  try {
    const pendingOwners = await User.getCourtOwnersByApprovalStatus('pending');

    res.status(200).json({
      message: 'Pending court owners retrieved successfully',
      court_owners: pendingOwners
    });
  } catch (error) {
    console.error('Error getting pending court owners:', error);
    res.status(500).json({ message: 'Server error while fetching pending court owners' });
  }
};

/**
 * Get all court owners with a specific approval status
 */
const getCourtOwnersByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    console.log(`Getting court owners with status: ${status}`);

    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected' });
    }

    // Kiểm tra xem admin đã được xác thực chưa
    if (!req.admin || !req.admin.id) {
      console.error('Admin not authenticated properly');
      return res.status(401).json({ message: 'Admin authentication failed' });
    }

    console.log('Admin authenticated:', req.admin.id);

    try {
      const owners = await User.getCourtOwnersByApprovalStatus(status);
      console.log(`Found ${owners ? owners.length : 0} court owners with status ${status}`);

      res.status(200).json({
        message: `Court owners with status '${status}' retrieved successfully`,
        court_owners: owners || []
      });
    } catch (dbError) {
      console.error('Database error getting court owners:', dbError);
      return res.status(500).json({
        message: 'Database error while fetching court owners',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error getting court owners by status:', error);
    res.status(500).json({
      message: 'Server error while fetching court owners',
      error: error.message
    });
  }
};

/**
 * Approve a court owner
 */
const approveCourtOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Update approval status
    const updatedUser = await User.updateApprovalStatus(id, 'approved', notes);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Court owner not found or not a court owner' });
    }

    res.status(200).json({
      message: 'Court owner approved successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error approving court owner:', error);
    res.status(500).json({ message: 'Server error while approving court owner' });
  }
};

/**
 * Reject a court owner
 */
const rejectCourtOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Update approval status
    const updatedUser = await User.updateApprovalStatus(id, 'rejected', notes);

    if (!updatedUser) {
      return res.status(404).json({ message: 'Court owner not found or not a court owner' });
    }

    res.status(200).json({
      message: 'Court owner rejected successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error rejecting court owner:', error);
    res.status(500).json({ message: 'Server error while rejecting court owner' });
  }
};

module.exports = {
  getPendingCourtOwners,
  getCourtOwnersByStatus,
  approveCourtOwner,
  rejectCourtOwner
};
