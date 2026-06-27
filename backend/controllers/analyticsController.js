const { getModels } = require('../config/db');

exports.getAnalytics = async (req, res) => {
  try {
    const models = getModels();
    const issues = await models.Issue.find();
    
    // 1. Category Distribution
    const categoriesMap = {};
    // 2. Monthly Trend
    const monthlyMap = {};
    // 3. Ward Distribution (Complaints count)
    const wardMap = {};
    // 4. Department Performance stats
    const deptMap = {
      Road: { total: 0, resolved: 0 },
      Water: { total: 0, resolved: 0 },
      Electricity: { total: 0, resolved: 0 },
      Drainage: { total: 0, resolved: 0 },
      Garbage: { total: 0, resolved: 0 },
      Traffic: { total: 0, resolved: 0 },
      'Public Works': { total: 0, resolved: 0 }
    };

    issues.forEach(issue => {
      categoriesMap[issue.category] = (categoriesMap[issue.category] || 0) + 1;
      
      const d = new Date(issue.createdAt);
      const mKey = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();
      monthlyMap[mKey] = (monthlyMap[mKey] || 0) + 1;

      const ward = issue.location?.ward || 'General';
      wardMap[ward] = (wardMap[ward] || 0) + 1;

      const dept = issue.assignedDepartment || 'Public Works';
      if (deptMap[dept]) {
        deptMap[dept].total += 1;
        if (issue.status === 'Resolved') {
          deptMap[dept].resolved += 1;
        }
      }
    });

    const categoryData = Object.keys(categoriesMap).map(name => ({
      name,
      value: categoriesMap[name]
    }));

    const monthlyData = Object.keys(monthlyMap).map(month => ({
      month,
      issues: monthlyMap[month]
    }));

    const wardData = Object.keys(wardMap).map(name => ({
      name,
      count: wardMap[name]
    })).sort((a,b) => b.count - a.count).slice(0, 5);

    const departmentData = Object.keys(deptMap).map(name => ({
      name,
      total: deptMap[name].total,
      resolved: deptMap[name].resolved,
      rate: deptMap[name].total > 0 
        ? Math.round((deptMap[name].resolved / deptMap[name].total) * 100) 
        : 0
    }));

    // 5. Daily trend (past 7 days)
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('default', { weekday: 'short' });
      dailyMap[label] = 0;
    }

    issues.forEach(issue => {
      const label = new Date(issue.createdAt).toLocaleDateString('default', { weekday: 'short' });
      if (dailyMap[label] !== undefined) {
        dailyMap[label]++;
      }
    });

    const dailyData = Object.keys(dailyMap).map(day => ({
      day,
      reports: dailyMap[day]
    }));

    // 6. Citizen Leaderboard
    const leaderboard = [
      { name: 'Dhruv Raj', points: 620, rank: 1, badge: '🥇 Community Hero' },
      { name: 'Ananya Iyer', points: 410, rank: 2, badge: '🥈 Problem Solver' },
      { name: 'Aarav Sharma', points: 250, rank: 3, badge: '🥉 Community Helper' },
      { name: 'Meera Nair', points: 180, rank: 4, badge: '🥉 Community Helper' },
      { name: 'Rahul Verma', points: 140, rank: 5, badge: '🥉 Community Helper' }
    ];

    // 7. Community Challenges Progress
    const challenges = [
      { id: 1, title: 'Clean Ward 142 (Sector 15)', target: 20, current: 15, type: 'Garbage' },
      { id: 2, title: 'Fix Outer Ring Road Lighting', target: 15, current: 9, type: 'Street Light' },
      { id: 3, title: 'Repair Sector 21 Potholes', target: 10, current: 10, type: 'Road' } // Completed!
    ];

    res.json({
      categoryData,
      monthlyData,
      wardData,
      departmentData,
      dailyData,
      leaderboard,
      challenges
    });
  } catch (error) {
    res.status(550).json({ error: error.message });
  }
};
