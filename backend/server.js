const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { initDB, getModels } = require('./config/db');
const ai = require('./utils/ai');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static upload folder
const UPLOADS_DIR = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize DB on startup (for both Vercel and local)
let dbInitialized = false;
async function ensureDB() {
  if (!dbInitialized) {
    dbInitialized = true;
    try {
      await initDB();
      const models = getModels();
      await seedDatabase(models);
      console.log('Database initialized successfully.');
    } catch (error) {
      console.error('Server failed to start database connection:', error);
    }
  }
}

// Middleware to ensure DB is ready before handling requests
app.use(async (req, res, next) => {
  await ensureDB();
  next();
});

// ----------------------------------------------------
// ROUTING MIDDLEWARES
// ----------------------------------------------------
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Root endpoint quick check
app.get('/', (req, res) => {
  res.json({ message: 'Community Hero MVC API server is active.' });
});

// Seed Initial Database Setup
async function seedDatabase(models) {
  const issueCount = await models.Issue.find();
  if (issueCount.length > 0) return;

  console.log('[Seed] Seeding default command controls database...');

  // Seed Departments
  const depts = [
    { name: 'Road', headOfficer: 'M. Srinivas', email: 'roads@bengaluru.gov.in' },
    { name: 'Water', headOfficer: 'R. K. Nagaraj', email: 'water@bengaluru.gov.in' },
    { name: 'Electricity', headOfficer: 'V. Sundaram', email: 'bescom@bengaluru.gov.in' },
    { name: 'Drainage', headOfficer: 'K. Gangadhar', email: 'drainage@bengaluru.gov.in' },
    { name: 'Garbage', headOfficer: 'Smt. Lakshmi', email: 'sanitation@bengaluru.gov.in' },
    { name: 'Traffic', headOfficer: 'K. P. Rao', email: 'traffic@bengaluru.gov.in' }
  ];
  for (const dept of depts) {
    await models.Department.create(dept);
  }

  // Seed Issues
  const sampleIssues = [
    {
      title: "Huge Pothole Near Metro Station Entrance",
      description: "A very large pothole has formed right in front of the main entrance to the metro station. It is dangerous for two-wheelers and pedestrian traffic, especially after sunset.",
      category: "Road",
      subcategory: "Pothole Damage",
      status: "Pending",
      priority: "High",
      severity: "Major",
      location: {
        address: "Metro Gate 2, Sector 15, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        ward: "Ward 142",
        district: "Bengaluru Urban",
        postalCode: "560001",
        latitude: 12.9716,
        longitude: 77.5946
      },
      imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600",
      reportedBy: { name: "Dhruv Raj", phone: "9876543210", email: "dhruv@communityhero.in" },
      verificationCount: 14,
      verifiedBy: ["user1", "user2"],
      likes: 28,
      likedBy: [],
      views: 120,
      assignedDepartment: "Road",
      estimatedResolutionDate: new Date(Date.now() + 86400000 * 3).toISOString() // 3 days SLA
    },
    {
      title: "Hanging Live Wire Near Children's Park",
      description: "A storm yesterday broke a tree branch which pulled down a live power cable. It is currently hanging low, just 6 feet off the ground, near the kids playground entrance.",
      category: "Electricity",
      subcategory: "Hanging Wire",
      status: "In Progress",
      priority: "Critical",
      severity: "Emergency",
      location: {
        address: "Park Street Road, Near Sector 21 Park, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        ward: "Ward 148",
        district: "Bengaluru Urban",
        postalCode: "560008",
        latitude: 12.9802,
        longitude: 77.5900
      },
      imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600",
      reportedBy: { name: "Aarav Sharma", phone: "9123456789", email: "aarav@gmail.com" },
      verificationCount: 42,
      verifiedBy: [],
      likes: 56,
      likedBy: [],
      views: 240,
      assignedDepartment: "Electricity",
      assignedOfficer: "Ramesh Kumar (EE-Div 2)",
      estimatedResolutionDate: new Date(Date.now() + 86400000).toISOString() // 24 hours SLA
    },
    {
      title: "Broken Streetlight Near Senior Citizen Home",
      description: "The street light in front of the Asha Senior Care Center has been non-functional for the past 2 weeks. The entire corner is pitch black, making elderly citizens afraid to walk.",
      category: "Street Light",
      subcategory: "Broken Lamp",
      status: "Resolved",
      priority: "Low",
      severity: "Minor",
      location: {
        address: "12th Cross, Outer Ring Road, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        ward: "Ward 120",
        district: "Bengaluru Urban",
        postalCode: "560012",
        latitude: 12.9650,
        longitude: 77.5850
      },
      imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?q=80&w=600",
      beforeImage: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?q=80&w=600",
      afterImage: "https://images.unsplash.com/photo-1520690214124-2405c5217036?q=80&w=600",
      reportedBy: { name: "Meera Nair", phone: "9845612300", email: "meera.n@yahoo.com" },
      verificationCount: 18,
      verifiedBy: [],
      likes: 12,
      likedBy: [],
      views: 88,
      assignedDepartment: "Electricity",
      assignedOfficer: "S. Murthy",
      resolvedAt: new Date(Date.now() - 86400000).toISOString(), // Resolved yesterday
      resolutionRemark: "Replaced burnt LED bulb assembly and cleaned diffused glass. Operable.",
      estimatedResolutionDate: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ];

  for (const item of sampleIssues) {
    const rawIssue = await models.Issue.create(item);
    
    // Log initial seed activity
    await models.ActivityLog.create({
      issueId: rawIssue._id,
      action: rawIssue.status === 'Resolved' ? 'Resolved' : rawIssue.status === 'In Progress' ? 'Work Started' : 'Reported',
      performedBy: rawIssue.status === 'Resolved' ? 'S. Murthy (EE)' : 'System Seeder',
      remarks: rawIssue.status === 'Resolved' ? rawIssue.resolutionRemark : 'Initial seed setup.'
    });
  }

  // Seed Notifications
  await models.Notification.create({
    user: 'citizen',
    title: 'Welcome to Community Hero!',
    message: 'Help improve your community by identifying, reporting, and confirming local complaints.'
  });

  console.log('[Seed] Seeding database completed successfully!');
}

// Bind Global Error Middleware
app.use(errorMiddleware);

// Launch Listener (only in local dev, not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server launching on port ${PORT}...`);
    await ensureDB();
    console.log(`Modular API Backend listening at http://localhost:${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
