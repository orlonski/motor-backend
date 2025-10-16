import express from 'express';
import { body } from 'express-validator';
import {
  analyzeStructure,
  validatePath,
  suggestTargetPath,
} from '../controllers/structureController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/endpoints/:endpointId/structure - Analisar estrutura do responseExample
router.get('/:endpointId/structure', analyzeStructure);

// POST /api/endpoints/:endpointId/validate-path - Validar se um caminho existe
router.post(
  '/:endpointId/validate-path',
  [
    body('sourcePath').trim().notEmpty().withMessage('sourcePath é obrigatório'),
    body('direction').optional().isIn(['request', 'response']).withMessage('direction inválido'),
  ],
  validate,
  validatePath
);

// POST /api/endpoints/:endpointId/suggest-target - Sugerir target path
router.post(
  '/:endpointId/suggest-target',
  [
    body('sourcePath').trim().notEmpty().withMessage('sourcePath é obrigatório'),
  ],
  validate,
  suggestTargetPath
);

export default router;