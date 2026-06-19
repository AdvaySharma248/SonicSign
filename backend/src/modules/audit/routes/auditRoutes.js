const express = require('express');
const { param } = require('express-validator');
const { auditController } = require('../controllers/auditController');
const { requireAuth } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');

const router = express.Router();

router.get('/', requireAuth, auditController.listMine);
router.get(
  '/:documentId',
  requireAuth,
  param('documentId').isMongoId().withMessage('Document id is invalid'),
  validate,
  auditController.listForDocument
);

module.exports = { auditRoutes: router };
