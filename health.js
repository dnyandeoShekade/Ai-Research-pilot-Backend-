const express = require('express');
const router = express.Router();

// Simple liveness/readiness probe
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;