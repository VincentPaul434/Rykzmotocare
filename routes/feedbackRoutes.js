const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// POST /api/feedback/submit
router.post('/submit', feedbackController.submitFeedback);

// GET /api/feedbacks (admin)
router.get('/', feedbackController.getAllFeedback);

// POST /api/feedback/reply (admin)
router.post('/reply', feedbackController.replyToFeedback);

module.exports = router;