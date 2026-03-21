//src/api/routes/content.routes.js
const express = require('express');
const router = express.Router();

// TODO: Implement content routes
router.get('/', (req, res) => {
  res.json({ message: 'Content routes coming soon' });
});

module.exports = router;