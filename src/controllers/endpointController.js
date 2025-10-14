import prisma from '../config/database.js';

// Listar todos os endpoints de uma integração
export const getEndpointsByIntegration = async (req, res, next) => {
  try {
    const { integrationId } = req.params;
    const { search } = req.query;

    const where = {
      integrationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { url: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const endpoints = await prisma.apiEndpoint.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { fieldMappings: true },
        },
      },
    });

    res.json(endpoints);
  } catch (error) {
    next(error);
  }
};

// Buscar um endpoint específico
export const getEndpointById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { id },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
          },
        },
        fieldMappings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    res.json(endpoint);
  } catch (error) {
    next(error);
  }
};

// Criar novo endpoint
export const createEndpoint = async (req, res, next) => {
  try {
    const {
      integrationId,
      name,
      httpMethod,
      url,
      headersTemplate,
      authenticationType,
    } = req.body;

    const endpoint = await prisma.apiEndpoint.create({
      data: {
        integrationId,
        name,
        httpMethod,
        url,
        headersTemplate: headersTemplate || {},
        authenticationType: authenticationType || 'None',
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(endpoint);
  } catch (error) {
    next(error);
  }
};

// Atualizar endpoint
export const updateEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      httpMethod,
      url,
      headersTemplate,
      authenticationType,
    } = req.body;

    const endpoint = await prisma.apiEndpoint.update({
      where: { id },
      data: {
        name,
        httpMethod,
        url,
        headersTemplate,
        authenticationType,
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(endpoint);
  } catch (error) {
    next(error);
  }
};

// Deletar endpoint
export const deleteEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.apiEndpoint.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
