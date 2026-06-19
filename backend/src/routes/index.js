const express = require('express');
const { authRoutes } = require('../modules/auth/routes/authRoutes');
const { userRoutes } = require('../modules/users/routes/userRoutes');
const { documentRoutes } = require('../modules/documents/routes/documentRoutes');
const { signerRoutes } = require('../modules/signatures/routes/signerRoutes');
const { signatureRoutes } = require('../modules/signatures/routes/signatureRoutes');
const { publicSigningRoutes } = require('../modules/signatures/routes/publicSigningRoutes');
const { auditRoutes } = require('../modules/audit/routes/auditRoutes');
const { dashboardRoutes } = require('../modules/dashboard/routes/dashboardRoutes');
const { userController } = require('../modules/users/controllers/userController');
const { updateProfileRules } = require('../modules/users/validators/userValidators');
const { signerController } = require('../modules/signatures/controllers/signerController');
const { createSignerRules } = require('../modules/signatures/validators/signerValidators');
const { emailController } = require('../controllers/email.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const apiRoutes = express.Router();

apiRoutes.get('/health', (_request, response) => {
  response.json({ success: true, message: 'SonicSign API is healthy' });
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.patch('/profile', requireAuth, updateProfileRules, validate, userController.updateProfile);
apiRoutes.put('/profile', requireAuth, updateProfileRules, validate, userController.updateProfile);
apiRoutes.post('/signature-request', requireAuth, createSignerRules, validate, signerController.create);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/documents', documentRoutes);
apiRoutes.use('/signers', signerRoutes);
apiRoutes.use('/signatures', signatureRoutes);
apiRoutes.use('/public', publicSigningRoutes);
apiRoutes.use('/audit', auditRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.get('/email/logs', requireAuth, emailController.listLogs);
apiRoutes.post('/email/test', requireAuth, emailController.testDiagnostics);

module.exports = { apiRoutes };
