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

// Testar endpoint e salvar exemplo de resposta
export const testEndpoint = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Buscar configuração do endpoint
    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { id },
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    // Preparar headers
    const headers = {
      ...(endpoint.headersTemplate || {}),
    };

    // Preparar body (se necessário)
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.httpMethod)) {
      body = endpoint.bodyTemplate || '';
    }

    // Fazer requisição para a API externa
    const fetchOptions = {
      method: endpoint.httpMethod,
      headers,
    };

    if (body) {
      fetchOptions.body = body;
    }

    let responseData;
    let responseStatus;
    let responseHeaders;
    let contentType = '';

    try {
      const response = await fetch(endpoint.url, fetchOptions);
      responseStatus = response.status;
      responseHeaders = Object.fromEntries(response.headers.entries());
      contentType = response.headers.get('content-type') || '';

      // Tentar fazer parse baseado no Content-Type
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('xml') || contentType.includes('soap')) {
        // Para XML/SOAP, parsear PRESERVANDO namespaces
        const xmlText = await response.text();
        
        try {
          // Importar xml2js dinamicamente
          const xml2js = await import('xml2js');
          
          // IMPORTANTE: Configuração para PRESERVAR namespaces
          const parser = new xml2js.Parser({
            explicitArray: true,           // Mantém arrays como arrays
            mergeAttrs: false,              // NÃO mescla atributos
            explicitRoot: false,            // Remove root desnecessário
            preserveChildrenOrder: false,   
            xmlns: true,                    // Preserva xmlns
            tagNameProcessors: [],          // NÃO processa nomes de tags (mantém namespace)
            attrNameProcessors: [],         // NÃO processa atributos
          });
          
          const parsedXml = await parser.parseStringPromise(xmlText);
          responseData = parsedXml;
          
          console.log('✓ XML/SOAP parseado com NAMESPACES preservados');
        } catch (xmlParseError) {
          console.error('Erro ao parsear XML:', xmlParseError.message);
          // Se falhar o parse, usa o XML como string
          responseData = xmlText;
        }
      } else {
        responseData = await response.text();
      }
    } catch (fetchError) {
      return res.status(500).json({
        error: 'Erro ao fazer requisição para a API externa',
        details: fetchError.message,
      });
    }

    // Salvar exemplo de resposta no banco (sucesso 2xx)
    console.log('🔍 DEBUG - Salvando exemplo:');
    console.log('  Status:', responseStatus);
    console.log('  Content-Type:', contentType);
    console.log('  Tipo de dados:', typeof responseData);
    
    let savedExample = false;
    
    if (responseStatus >= 200 && responseStatus < 300) {
      console.log('  ✓ Status 2xx - Tentando salvar...');
      try {
        await prisma.apiEndpoint.update({
          where: { id },
          data: {
            responseExample: responseData,
            lastTestedAt: new Date(),
          },
        });
        console.log('  ✓ Salvo com sucesso!');
        console.log('  ✓ Namespaces preservados:', JSON.stringify(responseData).includes(':'));
        savedExample = true;
      } catch (saveError) {
        console.error('  ✗ Erro ao salvar:', saveError.message);
      }
    } else {
      console.log('  ✗ Não salvou - Status não é 2xx');
    }

    // Retornar resultado do teste
    res.json({
      success: responseStatus >= 200 && responseStatus < 300,
      status: responseStatus,
      contentType,
      headers: responseHeaders,
      data: responseData,
      savedExample,
    });
  } catch (error) {
    next(error);
  }
};