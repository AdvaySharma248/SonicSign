const express = require('express');
const { signerController } = require('../controllers/signerController');
const { requireAuth } = require('../../../middleware/auth');
const { validate } = require('../../../middleware/validate');
const {
  createSignerRules,
  listSignerRules,
  signerIdRules,
  sendInviteRules,
  sendDocumentRules,
} = require('../validators/signerValidators');

const router = express.Router();

router.post('/', requireAuth, createSignerRules, validate, signerController.create);
router.get('/mine', requireAuth, signerController.listMine);
router.post('/documents/:documentId/send', requireAuth, sendDocumentRules, validate, signerController.sendDocument);
router.get('/:documentId', requireAuth, listSignerRules, validate, signerController.listByDocument);
router.delete('/:id', requireAuth, signerIdRules, validate, signerController.remove);
router.post('/send-invite', requireAuth, sendInviteRules, validate, signerController.sendInvite);

module.exports = { signerRoutes: router };
