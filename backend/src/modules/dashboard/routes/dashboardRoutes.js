const express = require('express');
const { dashboardController } = require('../controllers/dashboardController');
const { requireAuth } = require('../../../middleware/auth');

const router = express.Router();

router.get('/summary', requireAuth, dashboardController.summary);

module.exports = { dashboardRoutes: router };
