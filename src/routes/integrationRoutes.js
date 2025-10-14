import express from 'express';
import { body } from 'express-validator';
import {
  getAllIntegrations,
  getIntegrationById,
  createIntegration,
  updateIntegration,
  deleteIntegration,
} from '../controllers/integrationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/integrations - Listar todas as integrações
router.get('/', getAllIntegrations);

// GET /api/integrations/:id - Buscar integração específica
router.get('/:id', getIntegrationById);

// POST /api/integrations - Criar nova integração
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('description').optional().trim(),
  ],
  validate,
  createIntegration
);

// PUT /api/integrations/:id - Atualizar integração
router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('description').optional().trim(),
  ],
  validate,
  updateIntegration
);

// DELETE /api/integrations/:id - Deletar integração
router.delete('/:id', deleteIntegration);

export default router;
