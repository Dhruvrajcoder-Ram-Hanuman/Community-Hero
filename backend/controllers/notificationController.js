const { getModels } = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const models = getModels();
    const { user } = req.query; // citizen or official
    const filter = user ? { user } : {};
    
    const notifications = await models.Notification.find(filter);
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const models = getModels();
    const updated = await models.Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
