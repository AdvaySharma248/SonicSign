const express = require('express');
const { userController } = require('../controllers/userController');
const { updateProfileRules } = require('../validators/userValidators');
const { requireAuth } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');

const router = express.Router();

router.put('/profile', requireAuth, updateProfileRules, validate, userController.updateProfile);
router.patch('/profile', requireAuth, updateProfileRules, validate, userController.updateProfile);

module.exports = { userRoutes: router };
