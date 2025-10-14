import express from 'express';
import { body } from 'express-validator';
import {
  getMappingsByEndpoint,
  getMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
} from '../controllers/mappingController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/endpoints/:endpointId/mappings - Listar mapeamentos de um endpoint
router.get('/:endpointId/mappings', getMappingsByEndpoint);

// GET /api/mappings/:id - Buscar mapeamento específico
router.get('/:id', getMappingById);

// POST /api/mappings - Criar novo mapeamento
router.post(
  '/',
  [
    body('endpointId').notEmpty().withMessage('Endpoint ID é obrigatório'),
    body('direction')
      .trim()
      .notEmpty()
      .withMessage('Direction é obrigatório')
      .isIn(['request', 'response'])
      .withMessage('Direction deve ser "request" ou "response"'),
    body('sourcePath').trim().notEmpty().withMessage('Source path é obrigatório'),
    body('targetPath').trim().notEmpty().withMessage('Target path é obrigatório'),
  ],
  validate,
  createMapping
);

// PUT /api/mappings/:id - Atualizar mapeamento
router.put(
  '/:id',
  [
    body('direction')
      .optional()
      .trim()
      .isIn(['request', 'response'])
      .withMessage('Direction deve ser "request" ou "response"'),
    body('sourcePath').optional().trim().notEmpty().withMessage('Source path não pode ser vazio'),
    body('targetPath').optional().trim().notEmpty().withMessage('Target path não pode ser vazio'),
  ],
  validate,
  updateMapping
);

// DELETE /api/mappings/:id - Deletar mapeamento
router.delete('/:id', deleteMapping);

export default router;
