const User = require('../models/user.model');
const Reward = require('../models/reward.model');
const RewardHistory = require('../models/reward.history.model');
const RewardRule = require('../models/reward.rule.model');
const RewardService = require('../services/reward.service');

// Get user reward points
const getUserRewardPoints = async (req, res) => {
  try {
    const rewardPoints = await User.getRewardPoints(req.user.id);

    res.status(200).json({
      reward_points: rewardPoints
    });
  } catch (error) {
    console.error('Get user reward points error:', error);
    res.status(500).json({ message: 'Server error while fetching reward points' });
  }
};

// Get reward point history
const getRewardHistory = async (req, res) => {
  try {
    const history = await RewardHistory.getByUserId(req.user.id);

    res.status(200).json({
      history
    });
  } catch (error) {
    console.error('Get reward history error:', error);
    res.status(500).json({ message: 'Server error while fetching reward history' });
  }
};

// Get available rewards
const getAvailableRewards = async (req, res) => {
  try {
    const rewards = await Reward.getActive();

    res.status(200).json({
      rewards
    });
  } catch (error) {
    console.error('Get available rewards error:', error);
    res.status(500).json({ message: 'Server error while fetching available rewards' });
  }
};

// Redeem reward
const redeemReward = async (req, res) => {
  try {
    const { reward_id } = req.body;

    if (!reward_id) {
      return res.status(400).json({ message: 'Reward ID is required' });
    }

    try {
      // Use the reward service to handle redemption
      const result = await RewardService.redeemReward(req.user.id, reward_id);

      res.status(200).json({
        message: 'Reward redeemed successfully',
        redemption: result.redemption,
        reward: result.reward,
        remaining_points: result.remaining_points
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ message: 'Server error while redeeming reward' });
  }
};

// Create reward (admin only)
const createReward = async (req, res) => {
  try {
    const { name, description, points_required, is_active } = req.body;

    // Validate required fields
    if (!name || !points_required) {
      return res.status(400).json({ message: 'Name and points required are required' });
    }

    // Create reward
    const newReward = await Reward.create({
      name,
      description,
      points_required,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      message: 'Reward created successfully',
      reward: newReward
    });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ message: 'Server error while creating reward' });
  }
};

// Update reward (admin only)
const updateReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, points_required, is_active } = req.body;

    // Check if reward exists
    const reward = await Reward.findById(id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Update reward
    const updatedReward = await Reward.update(id, {
      name,
      description,
      points_required,
      is_active
    });

    res.status(200).json({
      message: 'Reward updated successfully',
      reward: updatedReward
    });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ message: 'Server error while updating reward' });
  }
};

// Delete reward (admin only)
const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if reward exists
    const reward = await Reward.findById(id);

    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Delete reward
    await Reward.delete(id);

    res.status(200).json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ message: 'Server error while deleting reward' });
  }
};

// Get all rewards (admin only)
const getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.getAll();

    res.status(200).json({
      rewards
    });
  } catch (error) {
    console.error('Get all rewards error:', error);
    res.status(500).json({ message: 'Server error while fetching rewards' });
  }
};

// Get user reward summary
const getUserRewardSummary = async (req, res) => {
  try {
    const summary = await RewardService.getUserRewardSummary(req.user.id);

    res.status(200).json(summary);
  } catch (error) {
    console.error('Get user reward summary error:', error);
    res.status(500).json({ message: 'Server error while fetching reward summary' });
  }
};

// Get reward rules (admin only)
const getRewardRules = async (req, res) => {
  try {
    const rules = await RewardRule.getAll();

    res.status(200).json({
      rules
    });
  } catch (error) {
    console.error('Get reward rules error:', error);
    res.status(500).json({ message: 'Server error while fetching reward rules' });
  }
};

// Create reward rule (admin only)
const createRewardRule = async (req, res) => {
  try {
    const {
      name,
      description,
      action_type,
      points,
      is_percentage,
      percentage_base,
      min_amount,
      max_points,
      is_active
    } = req.body;

    // Validate required fields
    if (!name || !action_type || points === undefined) {
      return res.status(400).json({ message: 'Name, action type, and points are required' });
    }

    // Create rule
    const newRule = await RewardRule.create({
      name,
      description,
      action_type,
      points,
      is_percentage,
      percentage_base,
      min_amount,
      max_points,
      is_active
    });

    res.status(201).json({
      message: 'Reward rule created successfully',
      rule: newRule
    });
  } catch (error) {
    console.error('Create reward rule error:', error);
    res.status(500).json({ message: 'Server error while creating reward rule' });
  }
};

// Update reward rule (admin only)
const updateRewardRule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      action_type,
      points,
      is_percentage,
      percentage_base,
      min_amount,
      max_points,
      is_active
    } = req.body;

    // Check if rule exists
    const rule = await RewardRule.findById(id);

    if (!rule) {
      return res.status(404).json({ message: 'Reward rule not found' });
    }

    // Update rule
    const updatedRule = await RewardRule.update(id, {
      name,
      description,
      action_type,
      points,
      is_percentage,
      percentage_base,
      min_amount,
      max_points,
      is_active
    });

    res.status(200).json({
      message: 'Reward rule updated successfully',
      rule: updatedRule
    });
  } catch (error) {
    console.error('Update reward rule error:', error);
    res.status(500).json({ message: 'Server error while updating reward rule' });
  }
};

// Delete reward rule (admin only)
const deleteRewardRule = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rule exists
    const rule = await RewardRule.findById(id);

    if (!rule) {
      return res.status(404).json({ message: 'Reward rule not found' });
    }

    // Delete rule
    await RewardRule.delete(id);

    res.status(200).json({ message: 'Reward rule deleted successfully' });
  } catch (error) {
    console.error('Delete reward rule error:', error);
    res.status(500).json({ message: 'Server error while deleting reward rule' });
  }
};

// Award points manually (admin only)
const awardPointsManually = async (req, res) => {
  try {
    const { user_id, points, description, action_type } = req.body;

    // Validate required fields
    if (!user_id || !points || !description) {
      return res.status(400).json({ message: 'User ID, points, and description are required' });
    }

    // Check if user exists
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Award points
    const historyEntry = await RewardService.awardPoints({
      action_type: action_type || 'manual',
      user_id,
      points,
      description
    });

    res.status(200).json({
      message: 'Points awarded successfully',
      history_entry: historyEntry
    });
  } catch (error) {
    console.error('Award points manually error:', error);
    res.status(500).json({ message: 'Server error while awarding points' });
  }
};

module.exports = {
  getUserRewardPoints,
  getRewardHistory,
  getAvailableRewards,
  redeemReward,
  getUserRewardSummary,
  createReward,
  updateReward,
  deleteReward,
  getAllRewards,
  getRewardRules,
  createRewardRule,
  updateRewardRule,
  deleteRewardRule,
  awardPointsManually
};
