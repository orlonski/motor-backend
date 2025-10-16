import express from 'express';
import { body } from 'express-validator';
import {
  getEndpointsByIntegration,
  getEndpointById,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  testEndpoint,
} from '../controllers/endpointController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/integrations/:integrationId/endpoints - Listar endpoints de uma integração
router.get('/:integrationId/endpoints', getEndpointsByIntegration);

// POST /api/endpoints/:id/test - Testar endpoint
router.post('/:id/test', testEndpoint);

// GET /api/endpoints/:id - Buscar endpoint específico
router.get('/:id', getEndpointById);

// POST /api/endpoints - Criar novo endpoint
router.post(
  '/',
  [
    body('integrationId').notEmpty().withMessage('Integration ID é obrigatório'),
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('httpMethod')
      .trim()
      .notEmpty()
      .withMessage('Método HTTP é obrigatório')
      .isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
      .withMessage('Método HTTP inválido'),
    body('url').trim().notEmpty().withMessage('URL é obrigatória'),
    body('headersTemplate').optional().isObject().withMessage('Headers deve ser um objeto JSON'),
    body('authenticationType').optional().trim(),
  ],
  validate,
  createEndpoint
);

// PUT /api/endpoints/:id - Atualizar endpoint
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('httpMethod')
      .optional()
      .trim()
      .isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
      .withMessage('Método HTTP inválido'),
    body('url').optional().trim().notEmpty().withMessage('URL não pode ser vazia'),
    body('headersTemplate').optional().isObject().withMessage('Headers deve ser um objeto JSON'),
    body('authenticationType').optional().trim(),
  ],
  validate,
  updateEndpoint
);

// DELETE /api/endpoints/:id - Deletar endpoint
router.delete('/:id', deleteEndpoint);

export default router;
