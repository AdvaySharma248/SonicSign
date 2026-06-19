const express = require('express');
const { documentController } = require('../controllers/documentController');
const { uploadPdf } = require('../../../middleware/upload');
const { requireAuth } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const {
  documentIdRule,
  uploadDocumentRules,
  updateDocumentRules,
  listDocumentRules,
} = require('../validators/documentValidators');

const router = express.Router();

router.post('/upload', requireAuth, uploadPdf.single('document'), uploadDocumentRules, validate, documentController.upload);
router.get('/', requireAuth, listDocumentRules, validate, documentController.list);
router.head('/:id/view', requireAuth, documentIdRule, validate, documentController.viewMetadata);
router.get('/:id/view', requireAuth, documentIdRule, validate, documentController.view);
router.get('/:id/download', requireAuth, documentIdRule, validate, documentController.download);
router.get('/:id', requireAuth, documentIdRule, validate, documentController.getById);
router.put('/:id', requireAuth, updateDocumentRules, validate, documentController.update);
router.delete('/:id', requireAuth, documentIdRule, validate, documentController.remove);
router.get('/:id/verify', requireAuth, documentIdRule, validate, documentController.verifyIntegrity);

module.exports = { documentRoutes: router };
