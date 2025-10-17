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
      typeResult,
    } = req.body;

    const endpoint = await prisma.apiEndpoint.create({
      data: {
        integrationId,
        name,
        httpMethod,
        url,
        headersTemplate: headersTemplate || {},
        authenticationType: authenticationType || 'None',
        typeResult: typeResult || 'json',
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
      typeResult,
    } = req.body;

    const endpoint = await prisma.apiEndpoint.update({
      where: { id },
      data: {
        name,
        httpMethod,
        url,
        headersTemplate,
        authenticationType,
        typeResult,
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

// Gerar mapped response através do n8n
export const generateMappedResponse = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar se o endpoint existe
    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        responseExample: true,
        typeResult: true,
        _count: {
          select: { fieldMappings: true },
        },
      },
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    // Verificar se tem responseExample
    if (!endpoint.responseExample) {
      return res.status(400).json({
        error: 'Nenhum exemplo de resposta disponível',
        message: 'Execute um teste no endpoint primeiro para gerar o response_example',
      });
    }

    // Verificar se tem field mappings
    if (endpoint._count.fieldMappings === 0) {
      return res.status(400).json({
        error: 'Nenhum mapeamento de campo configurado',
        message: 'Configure os field_mappings primeiro antes de gerar o mapped_response_example',
      });
    }

    console.log('🔄 Chamando serviço n8n para gerar mapped response...');
    console.log('  Endpoint ID:', id);

    // Chamar o serviço n8n
    let mappedData;
    let n8nStatus;

    try {
      const n8nResponse = await fetch('https://orlonski-n8n.zj8v6e.easypanel.host/webhook/motor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint_id: id,
        }),
      });

      n8nStatus = n8nResponse.status;

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('  ✗ Erro do n8n:', errorText);
        return res.status(500).json({
          error: 'Erro ao processar mapeamento no n8n',
          details: errorText,
          status: n8nStatus,
        });
      }

      // Detectar tipo de resposta baseado no Content-Type do n8n
      const contentType = n8nResponse.headers.get('content-type') || '';

      console.log('  ✓ Type Result do endpoint:', endpoint.typeResult);
      console.log('  ✓ Content-Type da resposta n8n:', contentType);

      // O n8n já retorna o formato correto (JSON ou XML) como string
      // Salvamos exatamente como veio, sem parsear
      mappedData = await n8nResponse.text();

      console.log('  ✓ Resposta recebida do n8n');
      console.log('  ✓ Tipo:', endpoint.typeResult);
      console.log('  ✓ Tamanho do conteúdo:', mappedData.length, 'caracteres');

      // Preview dos primeiros caracteres (para debug)
      const preview = mappedData.substring(0, 100).replace(/\n/g, ' ');
      console.log('  ✓ Preview:', preview + '...');

    } catch (fetchError) {
      console.error('  ✗ Erro ao conectar com n8n:', fetchError.message);
      return res.status(500).json({
        error: 'Erro ao conectar com o serviço de mapeamento (n8n)',
        details: fetchError.message,
      });
    }

    // Salvar o mapped response no banco
    try {
      await prisma.apiEndpoint.update({
        where: { id },
        data: {
          mappedResponseExample: mappedData,
        },
      });
      console.log('  ✓ mapped_response_example salvo no banco!');
    } catch (saveError) {
      console.error('  ✗ Erro ao salvar no banco:', saveError.message);
      return res.status(500).json({
        error: 'Erro ao salvar mapped_response_example no banco',
        details: saveError.message,
      });
    }

    // Retornar sucesso
    // Como mappedData agora é string (JSON ou XML), retornamos direto
    res.json({
      success: true,
      message: 'Mapped response gerado e salvo com sucesso',
      mappedData, // String com JSON ou XML
      stats: {
        totalMappings: endpoint._count.fieldMappings,
        typeResult: endpoint.typeResult,
        contentLength: mappedData.length,
      },
    });

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