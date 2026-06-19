const { body, param, query } = require('express-validator');
const { DOCUMENT_STATUS } = require('../../../constants/documentStatus');

const documentIdRule = [param('id').isMongoId().withMessage('Document id is invalid')];

const uploadDocumentRules = [body('title').optional().trim().isLength({ max: 160 })];

const updateDocumentRules = [
  ...documentIdRule,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 160 }),
  body('status').optional().isIn(Object.values(DOCUMENT_STATUS)).withMessage('Document status is invalid'),
  body('expiresAt').optional().isISO8601().withMessage('Expiration date is invalid'),
];

const listDocumentRules = [
  query('status').optional().isIn(Object.values(DOCUMENT_STATUS)).withMessage('Document status is invalid'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('from').optional().isISO8601().withMessage('From date is invalid'),
  query('to').optional().isISO8601().withMessage('To date is invalid'),
];

module.exports = {
  documentIdRule,
  uploadDocumentRules,
  updateDocumentRules,
  listDocumentRules,
};
