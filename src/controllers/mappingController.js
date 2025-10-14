import prisma from '../config/database.js';

// Listar todos os mapeamentos de um endpoint
export const getMappingsByEndpoint = async (req, res, next) => {
  try {
    const { endpointId } = req.params;
    const { direction, search } = req.query;

    const where = {
      endpointId,
      ...(direction && { direction }),
      ...(search && {
        OR: [
          { sourcePath: { contains: search, mode: 'insensitive' } },
          { targetPath: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const mappings = await prisma.fieldMapping.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            integration: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(mappings);
  } catch (error) {
    next(error);
  }
};

// Buscar um mapeamento específico
export const getMappingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mapping = await prisma.fieldMapping.findUnique({
      where: { id },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
            integration: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!mapping) {
      return res.status(404).json({ error: 'Mapeamento não encontrado' });
    }

    res.json(mapping);
  } catch (error) {
    next(error);
  }
};

// Criar novo mapeamento
export const createMapping = async (req, res, next) => {
  try {
    const { endpointId, direction, sourcePath, targetPath } = req.body;

    // Validar direction
    if (!['request', 'response'].includes(direction)) {
      return res.status(400).json({
        error: 'Direction inválido. Use "request" ou "response"',
      });
    }

    const mapping = await prisma.fieldMapping.create({
      data: {
        endpointId,
        direction,
        sourcePath,
        targetPath,
      },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(mapping);
  } catch (error) {
    next(error);
  }
};

// Atualizar mapeamento
export const updateMapping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { direction, sourcePath, targetPath } = req.body;

    // Validar direction se fornecido
    if (direction && !['request', 'response'].includes(direction)) {
      return res.status(400).json({
        error: 'Direction inválido. Use "request" ou "response"',
      });
    }

    const mapping = await prisma.fieldMapping.update({
      where: { id },
      data: {
        direction,
        sourcePath,
        targetPath,
      },
      include: {
        endpoint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(mapping);
  } catch (error) {
    next(error);
  }
};

// Deletar mapeamento
export const deleteMapping = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.fieldMapping.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
