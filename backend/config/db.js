const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ issues: [], comments: [], departments: [], notifications: [], activitylogs: [] }, null, 2)
  );
}

let localDb = { issues: [], comments: [], departments: [], notifications: [], activitylogs: [] };
try {
  localDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
} catch (e) {
  console.error('Error loading JSON fallback database, resetting...', e);
}

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2));
  } catch (e) {
    console.error('Error saving local database:', e);
  }
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Emulate Mongoose API over Local JSON storage
class LocalModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(filter = {}) {
    let items = localDb[this.collectionName] || [];
    return items.filter(item => {
      for (let key in filter) {
        // Handle MongoDB date filters (e.g. resolvedAt: { $lt: Date })
        if (filter[key] && typeof filter[key] === 'object' && filter[key].$lt) {
          const itemVal = new Date(item[key]);
          const filterVal = new Date(filter[key].$lt);
          if (!(itemVal < filterVal)) return false;
          continue;
        }

        if (key === '$or' && Array.isArray(filter.$or)) {
          return filter.$or.some(subFilter => {
            for (let subKey in subFilter) {
              if (String(item[subKey] || '').toLowerCase().includes(String(subFilter[subKey]).toLowerCase())) {
                return true;
              }
            }
            return false;
          });
        }
        
        if (filter[key] !== undefined) {
          if (typeof filter[key] === 'object' && filter[key] !== null) {
            if (filter[key].$in && Array.isArray(filter[key].$in)) {
              if (!filter[key].$in.includes(item[key])) return false;
            } else if (filter[key].$ne !== undefined) {
              if (item[key] === filter[key].$ne) return false;
            }
          } else {
            if (item[key] !== filter[key]) return false;
          }
        }
      }
      return true;
    });
  }

  async findById(id) {
    const items = localDb[this.collectionName] || [];
    const item = items.find(item => item._id === id);
    return item ? { ...item } : null;
  }

  async create(data) {
    const newItem = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    if (!localDb[this.collectionName]) {
      localDb[this.collectionName] = [];
    }
    localDb[this.collectionName].push(newItem);
    saveLocalDb();
    return { ...newItem };
  }

  async findByIdAndUpdate(id, updates, options = { new: true }) {
    const items = localDb[this.collectionName] || [];
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    let updatedItem = { ...items[index] };
    if (updates.$inc) {
      for (let field in updates.$inc) {
        updatedItem[field] = (updatedItem[field] || 0) + updates.$inc[field];
      }
      delete updates.$inc;
    }
    if (updates.$push) {
      for (let field in updates.$push) {
        if (!Array.isArray(updatedItem[field])) {
          updatedItem[field] = [];
        }
        updatedItem[field].push(updates.$push[field]);
      }
      delete updates.$push;
    }

    updatedItem = {
      ...updatedItem,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    items[index] = updatedItem;
    saveLocalDb();
    return { ...updatedItem };
  }

  async findByIdAndDelete(id) {
    const items = localDb[this.collectionName] || [];
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    saveLocalDb();
    return deleted;
  }
}

// Schemas DEFINITIONS
const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: String,
  status: { type: String, default: 'Pending' },
  priority: { type: String, default: 'Medium' },
  severity: { type: String, default: 'Moderate' },
  priorityScore: { type: Number, default: 50 }, // Dynamic AI Priority Score (0-100)
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    ward: String,
    district: String,
    postalCode: String,
    latitude: Number,
    longitude: Number
  },
  imageUrl: String,
  beforeImage: String,
  afterImage: String,
  reportedBy: {
    name: String,
    phone: String,
    email: String
  },
  verificationCount: { type: Number, default: 0 },
  verifiedBy: { type: [String], default: [] },
  rejectVotes: { type: Number, default: 0 },
  rejectedBy: { type: [String], default: [] },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  assignedDepartment: String,
  assignedOfficer: String,
  resolvedAt: Date,
  resolutionRemark: String,
  estimatedResolutionDate: Date,
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  issueId: { type: String, required: true },
  name: { type: String, required: true },
  comment: { type: String, required: true }
}, { timestamps: true });

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  headOfficer: String,
  email: String
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  user: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const ActivityLogSchema = new mongoose.Schema({
  issueId: { type: String, required: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  remarks: String
}, { timestamps: true });

let db = {};

async function initDB() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB Mongoose Connected.');
      db.Issue = mongoose.model('Issue', IssueSchema);
      db.Comment = mongoose.model('Comment', CommentSchema);
      db.Department = mongoose.model('Department', DepartmentSchema);
      db.Notification = mongoose.model('Notification', NotificationSchema);
      db.ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
      db.isFallback = false;
    } catch (e) {
      console.error('MongoDB Atlas Connection failed. Falling back to local file db.');
      setupLocalDB();
    }
  } else {
    setupLocalDB();
  }
  
  // Start database 1-week auto-cleanup task
  runCleanupTask();
  setInterval(runCleanupTask, 3600000); // Check every hour
}

function setupLocalDB() {
  db.Issue = new LocalModel('issues');
  db.Comment = new LocalModel('comments');
  db.Department = new LocalModel('departments');
  db.Notification = new LocalModel('notifications');
  db.ActivityLog = new LocalModel('activitylogs');
  db.isFallback = true;
  console.log('Local JSON File Database initialized (fallback active).');
}

// 1-Week Resolution Cleanup task
async function runCleanupTask() {
  console.log('[SLA Cleanup] Checking for resolved reports older than 7 days...');
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const resolvedIssues = await db.Issue.find({ status: 'Resolved' });
    let purgeCount = 0;

    for (const issue of resolvedIssues) {
      const resolvedAtDate = issue.resolvedAt ? new Date(issue.resolvedAt) : new Date(issue.updatedAt);
      
      if (resolvedAtDate < sevenDaysAgo) {
        await db.Issue.findByIdAndUpdate(issue._id, { isArchived: true });
        
        // Log in ActivityLogs
        await db.ActivityLog.create({
          issueId: issue._id,
          action: 'System Archive',
          performedBy: 'System Scheduler',
          remarks: `Resolved complaint '${issue.title}' automatically archived after 7 days.`
        });
        purgeCount++;
      }
    }
    
    if (purgeCount > 0) {
      console.log(`[SLA Cleanup] Successfully purged ${purgeCount} resolved issues older than 1 week.`);
    } else {
      console.log('[SLA Cleanup] No resolved issues met the 1-week cleanup threshold.');
    }
  } catch (error) {
    console.error('[SLA Cleanup] Error running database cleanup:', error);
  }
}

module.exports = {
  initDB,
  getModels: () => db,
  runCleanupTask
};
