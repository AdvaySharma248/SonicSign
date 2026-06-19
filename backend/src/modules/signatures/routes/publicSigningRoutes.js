const express = require('express');
const { signatureController } = require('../controllers/signatureController');
const { validate } = require('../../../middleware/validate');
const { publicTokenRules, publicSignRules, rejectRules, publicCompleteRules } = require('../validators/signatureValidators');

const router = express.Router();

router.get('/sign/:token', publicTokenRules, validate, signatureController.getPublicSigningSession);
router.get('/sign/:token/session', publicTokenRules, validate, signatureController.getPublicDocument);
router.get('/sign/:token/pdf', publicTokenRules, validate, signatureController.publicPdf);
router.post('/sign/:token', publicSignRules, validate, signatureController.publicSign);
router.post('/sign/:token/complete', publicCompleteRules, validate, signatureController.completePublicSigning);
router.post('/reject/:token', rejectRules, validate, signatureController.publicReject);

module.exports = { publicSigningRoutes: router };
