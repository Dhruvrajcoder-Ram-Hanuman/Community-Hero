function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// AI Image/Text Smart Assistant Suggestions
function analyzeIssueText(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  
  let category = 'Others';
  let subcategory = 'General';
  let severity = 'Moderate';
  let riskLevel = 'Moderate Risk';
  let diameter = 'N/A';
  let assignedDepartment = 'Public Works';
  let confidence = 0.70;

  // Custom parsed values
  if (text.includes('pothole') || text.includes('crater') || text.includes('road')) {
    category = 'Road';
    subcategory = 'Pothole Damage';
    assignedDepartment = 'Road';
    confidence = 0.96;
    diameter = '1.2 meters';
    severity = 'Major';
    riskLevel = 'Dangerous';
    if (text.includes('huge') || text.includes('massive')) {
      diameter = '2.4 meters';
      severity = 'Emergency';
      riskLevel = 'Extreme Danger';
    }
  } else if (text.includes('leak') || text.includes('water') || text.includes('burst')) {
    category = 'Water';
    subcategory = 'Pipe Leakage';
    assignedDepartment = 'Water';
    confidence = 0.94;
    severity = 'Moderate';
    riskLevel = 'Warning';
    if (text.includes('flooding') || text.includes('spray')) {
      severity = 'Major';
      riskLevel = 'Dangerous';
    }
  } else if (text.includes('garbage') || text.includes('dump') || text.includes('trash')) {
    category = 'Garbage';
    subcategory = 'Illegal Dumping';
    assignedDepartment = 'Garbage';
    confidence = 0.95;
    severity = 'Moderate';
    riskLevel = 'Warning';
    if (text.includes('stink') || text.includes('toxic') || text.includes('rats')) {
      severity = 'Major';
      riskLevel = 'Dangerous';
    }
  } else if (text.includes('light') || text.includes('dark') || text.includes('bulb')) {
    category = 'Street Light';
    subcategory = 'Broken Lamp';
    assignedDepartment = 'Electricity';
    confidence = 0.93;
    severity = 'Minor';
    riskLevel = 'Low Risk';
  } else if (text.includes('wire') || text.includes('electric') || text.includes('power')) {
    category = 'Electricity';
    subcategory = 'Hanging Wire';
    assignedDepartment = 'Electricity';
    confidence = 0.91;
    severity = 'Emergency';
    riskLevel = 'Extreme Danger';
  } else if (text.includes('drain') || text.includes('overflow') || text.includes('gutter')) {
    category = 'Drainage';
    subcategory = 'Drainage Blockage';
    assignedDepartment = 'Drainage';
    confidence = 0.92;
    severity = 'Major';
    riskLevel = 'Dangerous';
  } else if (text.includes('traffic') || text.includes('jam') || text.includes('signal')) {
    category = 'Traffic';
    subcategory = 'Traffic Congestion';
    assignedDepartment = 'Traffic';
    confidence = 0.90;
    severity = 'Moderate';
    riskLevel = 'Warning';
  }

  return { category, subcategory, severity, riskLevel, diameter, suggestedDepartment: assignedDepartment, confidence };
}

// Calculate AI Priority Score (0-100 weighted equation)
function calculatePriorityScore(issue, currentVotes = 0) {
  let score = 0;

  // 1. Severity Score (Max 50)
  const severity = issue.severity || 'Moderate';
  let severityScore = 20; // Moderate default
  if (severity === 'Emergency') severityScore = 50;
  else if (severity === 'Major') severityScore = 35;
  else if (severity === 'Moderate') severityScore = 20;
  else if (severity === 'Minor') severityScore = 5;
  score += severityScore;

  // 2. People Affected (Max 20)
  // Heuristic: estimate based on description size or keywords
  const desc = `${issue.title} ${issue.description}`.toLowerCase();
  let peopleAffectedScore = 8; // Default
  if (desc.includes('busy') || desc.includes('main road') || desc.includes('market') || desc.includes('crowded') || desc.includes('heavy')) {
    peopleAffectedScore = 20;
  } else if (desc.includes('residential') || desc.includes('street') || desc.includes('colony')) {
    peopleAffectedScore = 14;
  }
  score += peopleAffectedScore;

  // 3. Age of Issue (Max 15)
  // 1 point per day since creation, capped at 15
  const createdAt = issue.createdAt ? new Date(issue.createdAt) : new Date();
  const diffTime = Math.abs(new Date() - createdAt);
  const diffDays = Math.min(15, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  score += diffDays;

  // 4. Community Votes (Max 10)
  // 1 point per vote/verification, capped at 10
  const votes = currentVotes || issue.verificationCount || 0;
  score += Math.min(10, votes);

  // 5. School/Hospital Nearby (Max 5)
  let schoolHospitalScore = 0;
  if (desc.includes('school') || desc.includes('hospital') || desc.includes('clinic') || desc.includes('college') || desc.includes('park')) {
    schoolHospitalScore = 5;
  }
  score += schoolHospitalScore;

  return Math.min(100, score);
}

// Duplicate Detection: Checks 30 meters and 2 days (48 hours)
async function checkDuplicateProximity(IssueModel, lat, lon, category) {
  if (!lat || !lon || !category) return { duplicateFound: false, duplicates: [] };
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Get active unresolved issues in the same category
  const activeIssues = await IssueModel.find({
    category: category,
    status: { $ne: 'Resolved' }
  });

  const duplicates = [];

  for (const issue of activeIssues) {
    const issueLat = issue.location?.latitude;
    const issueLon = issue.location?.longitude;
    const createdAt = new Date(issue.createdAt);

    if (issueLat && issueLon && createdAt > twoDaysAgo) {
      const distance = getDistance(lat, lon, issueLat, issueLon);
      // Distance threshold: 30 meters
      if (distance <= 30) {
        duplicates.push({
          _id: issue._id,
          title: issue.title,
          distance: Math.round(distance),
          status: issue.status,
          createdAt: issue.createdAt
        });
      }
    }
  }

  return {
    duplicateFound: duplicates.length > 0,
    duplicates
  };
}

module.exports = {
  analyzeIssueText,
  calculatePriorityScore,
  checkDuplicateProximity,
  getDistance
};
