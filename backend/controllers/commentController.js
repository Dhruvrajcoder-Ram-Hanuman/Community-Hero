const { getModels } = require('../config/db');

// Add comment to an issue
exports.addComment = async (req, res) => {
  try {
    const models = getModels();
    const { issueId, name, comment } = req.body;
    
    if (!issueId || !name || !comment) {
      return res.status(400).json({ error: 'IssueId, name, and comment text are required.' });
    }

    const newComment = await models.Comment.create({ issueId, name, comment });
    
    // Log Activity
    await models.ActivityLog.create({
      issueId,
      action: 'Comment Added',
      performedBy: name,
      remarks: `Citizen commented: "${comment.substring(0, 40)}..."`
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch comments list for an issue
exports.getCommentsByIssue = async (req, res) => {
  try {
    const models = getModels();
    const comments = await models.Comment.find({ issueId: req.params.issueId });
    // Sort oldest first for conversation timelines
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
