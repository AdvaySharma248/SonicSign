const express = require('express');
const { authController } = require('../controllers/authController');
const { verifyFirebaseToken } = require('../../../middleware/verifyFirebaseToken');

const router = express.Router();

router.get('/me', verifyFirebaseToken, authController.me);

module.exports = { authRoutes: router };
