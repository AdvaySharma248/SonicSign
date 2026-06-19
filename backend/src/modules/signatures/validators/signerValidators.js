const { body, param } = require('express-validator');

const createSignerRules = [
  body('documentId').isMongoId().withMessage('Document id is invalid'),
  body('name').trim().notEmpty().withMessage('Signer name is required').isLength({ max: 120 }),
  body('email').isEmail().withMessage('A valid signer email is required').normalizeEmail(),
  body('role').optional().trim().isLength({ max: 120 }),
  body('signingOrder').optional().isInt({ min: 1 }),
  body('isOwner').optional().isBoolean(),
];

const listSignerRules = [param('documentId').isMongoId().withMessage('Document id is invalid')];
const signerIdRules = [param('id').isMongoId().withMessage('Signer id is invalid')];
const sendInviteRules = [body('signerId').isMongoId().withMessage('Signer id is invalid')];
const sendDocumentRules = [param('documentId').isMongoId().withMessage('Document id is invalid')];

module.exports = { createSignerRules, listSignerRules, signerIdRules, sendInviteRules, sendDocumentRules };
