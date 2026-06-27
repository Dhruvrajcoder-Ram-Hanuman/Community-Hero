const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const upload = require('../middlewares/uploadMiddleware');

router.post('/ai-suggest', issueController.aiSuggest);
router.post('/check-duplicate', issueController.checkDuplicate);
router.post('/trigger-cleanup', issueController.triggerCleanup);

router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);
router.post('/', upload.single('image'), issueController.createIssue);
router.put('/:id', issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

// Locked status transitions and assigns
router.patch('/:id/status', upload.single('afterImage'), issueController.updateStatus);
router.patch('/:id/assign', issueController.assignDepartment);

// Upvotes and confirmations
router.patch('/:id/verify', issueController.verifyIssue);

module.exports = router;
