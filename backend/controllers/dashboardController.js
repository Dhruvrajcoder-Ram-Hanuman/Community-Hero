const { getModels } = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const models = getModels();
    const issues = await models.Issue.find();
    
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'Pending').length;
    const verified = issues.filter(i => i.status === 'Verified').length;
    const assigned = issues.filter(i => i.status === 'Assigned').length;
    const inProgress = issues.filter(i => i.status === 'In Progress').length;
    const resolved = issues.filter(i => i.status === 'Resolved').length;
    
    const critical = issues.filter(i => i.priority === 'Critical' && i.status !== 'Resolved').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const today = issues.filter(i => i.createdAt.startsWith(todayStr)).length;

    res.json({
      total,
      pending,
      verified,
      assigned,
      inProgress,
      resolved,
      critical,
      today
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
