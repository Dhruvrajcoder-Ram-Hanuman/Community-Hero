const { getModels } = require('../config/db');
const ai = require('../utils/ai');

// Get all issues with filters, search, pagination, and sorting
exports.getIssues = async (req, res) => {
  try {
    const models = getModels();
    const { 
      search, category, status, priority, severity, 
      assignedDepartment, ward, hasImage, sort, 
      nearby, userLat, userLon, userRadiusMeters,
      page, limit
    } = req.query;

    let filter = { isArchived: { $ne: true } };

    // Smart Search parser heuristics
    if (search) {
      const q = search.toLowerCase();
      
      // Category triggers
      if (q.includes('road') || q.includes('pothole') || q.includes('cracks')) {
        filter.category = 'Road';
      } else if (q.includes('water') || q.includes('leak') || q.includes('pipe')) {
        filter.category = 'Water';
      } else if (q.includes('garbage') || q.includes('waste') || q.includes('trash') || q.includes('dump')) {
        filter.category = 'Garbage';
      } else if (q.includes('street light') || q.includes('streetlight') || q.includes('light') || q.includes('lamp')) {
        filter.category = 'Street Light';
      } else if (q.includes('electric') || q.includes('wire') || q.includes('power')) {
        filter.category = 'Electricity';
      } else if (q.includes('drain') || q.includes('sewage') || q.includes('gutter')) {
        filter.category = 'Drainage';
      } else if (q.includes('traffic') || q.includes('signal')) {
        filter.category = 'Traffic';
      }

      // Time indicators
      if (q.includes('today')) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: startOfDay.toISOString() };
      } else if (q.includes('week') || q.includes('this week')) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filter.createdAt = { $gte: oneWeekAgo.toISOString() };
      }

      // Keyword search if no categories matches
      if (!filter.category && !filter.createdAt) {
        filter.$or = [
          { title: search },
          { description: search },
          { 'location.address': search }
        ];
      }
    }

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (severity) filter.severity = severity;
    if (assignedDepartment) filter.assignedDepartment = assignedDepartment;
    if (ward) filter['location.ward'] = ward;
    
    if (hasImage === 'true') {
      filter.imageUrl = { $ne: null };
    }

    let issues = await models.Issue.find(filter);

    // Dynamic Priority Scoring calculation and seeding
    issues = issues.map(issue => {
      const score = ai.calculatePriorityScore(issue);
      return {
        ...issue,
        priorityScore: score
      };
    });

    // Nearby Geolocation Filtering
    if (nearby === 'true' && userLat && userLon) {
      const radius = parseFloat(userRadiusMeters) || 1000; // default 1km
      const latVal = parseFloat(userLat);
      const lonVal = parseFloat(userLon);

      issues = issues.filter(issue => {
        const issueLat = issue.location?.latitude;
        const issueLon = issue.location?.longitude;
        if (!issueLat || !issueLon) return false;
        const dist = ai.getDistance(latVal, lonVal, issueLat, issueLon);
        return dist <= radius;
      });
    }

    // Apply Sorting
    if (sort === 'priority' || !sort) {
      // Default: sort descending by Priority Score
      issues.sort((a, b) => b.priorityScore - a.priorityScore);
    } else if (sort === 'newest') {
      issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === 'oldest') {
      issues.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'verified') {
      issues.sort((a, b) => (b.verificationCount || 0) - (a.verificationCount || 0));
    } else if (sort === 'views') {
      issues.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedIssues = issues.slice(startIndex, startIndex + limitNum);

    res.json({
      total: issues.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(issues.length / limitNum),
      data: paginatedIssues
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single issue
exports.getIssueById = async (req, res) => {
  try {
    const models = getModels();
    const issue = await models.Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue record not found' });
    }

    // Track views
    await models.Issue.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    // Recalculate priorityScore
    const priorityScore = ai.calculatePriorityScore(issue);

    res.json({
      ...issue,
      priorityScore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Report a new issue (Duplicate detection check blocks submission)
exports.createIssue = async (req, res) => {
  try {
    const models = getModels();
    const issueData = { ...req.body };

    if (typeof issueData.location === 'string') {
      issueData.location = JSON.parse(issueData.location);
    }
    if (typeof issueData.reportedBy === 'string') {
      issueData.reportedBy = JSON.parse(issueData.reportedBy);
    }

    // 1. Strict Duplicate Check Proximity Block (30m / 2 days)
    const lat = issueData.location?.latitude;
    const lon = issueData.location?.longitude;
    const category = issueData.category || 'Others';

    const checkDup = await ai.checkDuplicateProximity(models.Issue, lat, lon, category);
    if (checkDup.duplicateFound) {
      return res.status(400).json({
        error: 'Duplicate Report Blocked',
        message: `A similar issue in ${category} was reported ${checkDup.duplicates[0].distance} meters away within the last 2 days. Please upvote the existing report.`,
        duplicates: checkDup.duplicates
      });
    }

    if (req.file) {
      issueData.imageUrl = `/uploads/${req.file.filename}`;
      issueData.beforeImage = `/uploads/${req.file.filename}`;
    }

    // Heuristics auto Suggestion
    const aiSug = ai.analyzeIssueText(issueData.title, issueData.description);
    if (!issueData.category || issueData.category === 'Others') {
      issueData.category = aiSug.category;
      issueData.subcategory = aiSug.subcategory;
      issueData.severity = aiSug.severity;
      issueData.assignedDepartment = aiSug.suggestedDepartment;
    }

    if (!issueData.priority) issueData.priority = aiSug.severity === 'Emergency' ? 'Critical' : 'Medium';
    if (!issueData.severity) issueData.severity = aiSug.severity;
    if (!issueData.assignedDepartment) issueData.assignedDepartment = aiSug.suggestedDepartment;

    const newIssue = await models.Issue.create(issueData);

    // Create ActivityLog
    await models.ActivityLog.create({
      issueId: newIssue._id,
      action: 'Reported',
      performedBy: newIssue.reportedBy?.name || 'Citizen',
      remarks: 'Issue reported and mapped.'
    });

    // Create Notification
    await models.Notification.create({
      user: 'official',
      title: 'New Issue Registered',
      message: `A new ${newIssue.category} report has been filed in ${newIssue.location?.ward || 'your area'}.`
    });

    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit issue
exports.updateIssue = async (req, res) => {
  try {
    const models = getModels();
    const updated = await models.Issue.findByIdAndUpdate(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete issue
exports.deleteIssue = async (req, res) => {
  try {
    const models = getModels();
    await models.Issue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Issue record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change Status (Locked to officials)
exports.updateStatus = async (req, res) => {
  try {
    const models = getModels();
    const { status, resolutionRemark } = req.body;
    const issueId = req.params.id;

    let updates = { status };
    if (resolutionRemark) updates.resolutionRemark = resolutionRemark;

    if (status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
      if (req.file) {
        updates.afterImage = `/uploads/${req.file.filename}`;
      }
    }

    const updated = await models.Issue.findByIdAndUpdate(issueId, updates);
    if (!updated) return res.status(404).json({ error: 'Issue not found' });

    // Log Activity
    await models.ActivityLog.create({
      issueId,
      action: 'Status Changed',
      performedBy: 'Department Officer',
      remarks: `Issue status changed to ${status}. ${resolutionRemark ? 'Remark: ' + resolutionRemark : ''}`
    });

    // Notify citizens
    await models.Notification.create({
      user: 'citizen',
      title: 'Issue Status Updated',
      message: `Your reported complaint '${updated.title}' has been moved to ${status}.`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign Department & Officer
exports.assignDepartment = async (req, res) => {
  try {
    const models = getModels();
    const { assignedDepartment, assignedOfficer } = req.body;
    const issueId = req.params.id;

    const updated = await models.Issue.findByIdAndUpdate(issueId, {
      status: 'Assigned',
      assignedDepartment,
      assignedOfficer
    });

    // Log Activity
    await models.ActivityLog.create({
      issueId,
      action: 'Assigned',
      performedBy: 'Command Center',
      remarks: `Issue assigned to ${assignedDepartment} Department under officer ${assignedOfficer}.`
    });

    // Notify citizens
    await models.Notification.create({
      user: 'citizen',
      title: 'Department Assigned',
      message: `Your issue '${updated.title}' is now handled by the ${assignedDepartment} Department.`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify/Vote (Upvote ✓ I confirm, ✗ I don't see this anymore)
exports.verifyIssue = async (req, res) => {
  try {
    const models = getModels();
    const issueId = req.params.id;
    const { userId, voteType } = req.body; // voteType: 'confirm', 'like', 'reject'

    const issue = await models.Issue.findById(issueId);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    let updates = {};
    if (voteType === 'confirm') {
      const verifiedBy = issue.verifiedBy || [];
      if (verifiedBy.includes(userId)) {
        // Toggle off
        updates.verifiedBy = verifiedBy.filter(id => id !== userId);
        updates.verificationCount = Math.max(0, (issue.verificationCount || 1) - 1);
      } else {
        // Confirm vote
        updates.verifiedBy = [...verifiedBy, userId];
        updates.verificationCount = (issue.verificationCount || 0) + 1;
        
        // Remove from reject list if present
        const rejectedBy = issue.rejectedBy || [];
        if (rejectedBy.includes(userId)) {
          updates.rejectedBy = rejectedBy.filter(id => id !== userId);
          updates.rejectVotes = Math.max(0, (issue.rejectVotes || 1) - 1);
        }
      }
    } else if (voteType === 'reject') {
      const rejectedBy = issue.rejectedBy || [];
      if (rejectedBy.includes(userId)) {
        updates.rejectedBy = rejectedBy.filter(id => id !== userId);
        updates.rejectVotes = Math.max(0, (issue.rejectVotes || 1) - 1);
      } else {
        updates.rejectedBy = [...rejectedBy, userId];
        updates.rejectVotes = (issue.rejectVotes || 0) + 1;

        // Remove from confirm list if present
        const verifiedBy = issue.verifiedBy || [];
        if (verifiedBy.includes(userId)) {
          updates.verifiedBy = verifiedBy.filter(id => id !== userId);
          updates.verificationCount = Math.max(0, (issue.verificationCount || 1) - 1);
        }
      }
    } else if (voteType === 'like') {
      const likedBy = issue.likedBy || [];
      if (likedBy.includes(userId)) {
        updates.likedBy = likedBy.filter(id => id !== userId);
        updates.likes = Math.max(0, (issue.likes || 1) - 1);
      } else {
        updates.likedBy = [...likedBy, userId];
        updates.likes = (issue.likes || 0) + 1;
      }
    }

    // Community Verification Threshold (Verified by Community if confirmations >= 15)
    // We compute this dynamically. If updates.verificationCount is set, use it, else current.
    const newConfirmCount = updates.verificationCount !== undefined ? updates.verificationCount : (issue.verificationCount || 0);
    if (newConfirmCount >= 15 && issue.status === 'Pending') {
      updates.status = 'Verified';
    }

    const updatedIssue = await models.Issue.findByIdAndUpdate(issueId, updates);
    res.json(updatedIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.aiSuggest = async (req, res) => {
  try {
    const { title, description } = req.body;
    const suggestion = ai.analyzeIssueText(title, description);
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkDuplicate = async (req, res) => {
  try {
    const { latitude, longitude, category } = req.body;
    const models = getModels();
    const check = await ai.checkDuplicateProximity(models.Issue, latitude, longitude, category);
    res.json(check);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.triggerCleanup = async (req, res) => {
  try {
    const { runCleanupTask } = require('../config/db');
    const report = await runCleanupTask();
    res.json({ message: 'Manual SLA Resolved Purge Task completed.', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

