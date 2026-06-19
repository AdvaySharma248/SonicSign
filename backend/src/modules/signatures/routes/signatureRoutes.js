const express = require('express');
const { signatureController } = require('../controllers/signatureController');
const { requireAuth } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const {
  createSignatureRules,
  updateSignatureRules,
  signatureDocumentRules,
  signatureIdRules,
  finalizeRules,
  saveFieldsRules,
  fieldDocumentRules,
} = require('../validators/signatureValidators');

const router = express.Router();

router.post('/', requireAuth, createSignatureRules, validate, signatureController.create);
router.get('/:documentId', requireAuth, signatureDocumentRules, validate, signatureController.listByDocument);
router.put('/:id', requireAuth, updateSignatureRules, validate, signatureController.update);
router.delete('/:id', requireAuth, signatureIdRules, validate, signatureController.remove);
router.post('/finalize', requireAuth, finalizeRules, validate, signatureController.finalize);
router.put('/fields/:documentId', requireAuth, fieldDocumentRules, saveFieldsRules, validate, signatureController.saveFields);
router.get('/fields/:documentId', requireAuth, fieldDocumentRules, validate, signatureController.listFields);

module.exports = { signatureRoutes: router };
