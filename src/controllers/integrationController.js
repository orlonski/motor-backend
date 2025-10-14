import prisma from '../config/database.js';

// Listar todas as integrações
export const getAllIntegrations = async (req, res, next) => {
  try {
    const { search } = req.query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const integrations = await prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { endpoints: true },
        },
      },
    });

    res.json(integrations);
  } catch (error) {
    next(error);
  }
};

// Buscar uma integração específica
export const getIntegrationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findUnique({
      where: { id },
      include: {
        endpoints: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    res.json(integration);
  } catch (error) {
    next(error);
  }
};

// Criar nova integração
export const createIntegration = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const integration = await prisma.integration.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json(integration);
  } catch (error) {
    next(error);
  }
};

// Atualizar integração
export const updateIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.json(integration);
  } catch (error) {
    next(error);
  }
};

// Deletar integração
export const deleteIntegration = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.integration.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
