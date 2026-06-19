const { body, param } = require('express-validator');

const signatureShapeRules = [
  body('page').isInt({ min: 1 }).withMessage('Page must be a positive number'),
  body('x').isFloat({ min: 0 }).withMessage('X coordinate is invalid'),
  body('y').isFloat({ min: 0 }).withMessage('Y coordinate is invalid'),
  body('width').isFloat({ min: 1 }).withMessage('Width is invalid'),
  body('height').isFloat({ min: 1 }).withMessage('Height is invalid'),
  body('signatureImage').isString().notEmpty().withMessage('Signature image is required'),
];

const createSignatureRules = [
  body('documentId').isMongoId().withMessage('Document id is invalid'),
  body('signerId').isMongoId().withMessage('Signer id is invalid'),
  ...signatureShapeRules,
];

const updateSignatureRules = [
  param('id').isMongoId().withMessage('Signature id is invalid'),
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  body('x').optional().isFloat({ min: 0 }).withMessage('X coordinate is invalid'),
  body('y').optional().isFloat({ min: 0 }).withMessage('Y coordinate is invalid'),
  body('width').optional().isFloat({ min: 1 }).withMessage('Width is invalid'),
  body('height').optional().isFloat({ min: 1 }).withMessage('Height is invalid'),
];

const signatureDocumentRules = [param('documentId').isMongoId().withMessage('Document id is invalid')];
const signatureIdRules = [param('id').isMongoId().withMessage('Signature id is invalid')];
const finalizeRules = [body('documentId').isMongoId().withMessage('Document id is invalid')];
const publicTokenRules = [param('token').isLength({ min: 32 }).withMessage('Signing token is invalid')];
const publicSignRules = [...publicTokenRules, ...signatureShapeRules];
const saveFieldsRules = [
  body('fields').isArray().withMessage('Fields must be an array'),
  body('fields.*.signerId').isMongoId(),
  body('fields.*.page').isInt({ min: 1 }),
  body('fields.*.x').isFloat({ min: 0, max: 100 }),
  body('fields.*.y').isFloat({ min: 0, max: 100 }),
  body('fields.*.width').isFloat({ min: 1, max: 100 }),
  body('fields.*.height').isFloat({ min: 1, max: 100 }),
  body('fields.*.type').isIn(['signature', 'initials', 'date', 'text']),
  body('fields.*.required').optional().isBoolean(),
  body('fields.*.label').optional().trim().isLength({ max: 120 }),
];
const fieldDocumentRules = [param('documentId').isMongoId().withMessage('Document id is invalid')];
const publicCompleteRules = [...publicTokenRules, body('values').isArray().withMessage('Field values are required'), body('values.*.fieldId').isMongoId(), body('values.*.value').isString().notEmpty(), body('values.*.signatureMethod').optional().isIn(['draw', 'type', 'upload'])];
const rejectRules = [...publicTokenRules, body('reason').optional().trim().isLength({ max: 500 })];

module.exports = {
  createSignatureRules,
  updateSignatureRules,
  signatureDocumentRules,
  signatureIdRules,
  finalizeRules,
  publicTokenRules,
  publicSignRules,
  rejectRules,
  saveFieldsRules,
  fieldDocumentRules,
  publicCompleteRules,
};
