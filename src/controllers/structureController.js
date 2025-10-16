import prisma from '../config/database.js';

// Função recursiva para extrair todos os caminhos possíveis de um objeto
function extractPaths(obj, prefix = '', paths = new Set()) {
  if (obj === null || obj === undefined) {
    return paths;
  }

  // Se for array
  if (Array.isArray(obj)) {
    // Adiciona o caminho do array com [*]
    if (prefix) {
      paths.add(`${prefix}[*]`);
    }
    
    // Analisa o primeiro elemento para descobrir a estrutura
    if (obj.length > 0) {
      extractPaths(obj[0], prefix ? `${prefix}[*]` : '', paths);
    }
    return paths;
  }

  // Se for objeto
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Ignora propriedades especiais do xml2js ($, $ns, _)
        if (key === '$' || key === '$ns' || key === '_') {
          continue;
        }
        
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        // Adiciona o caminho atual
        paths.add(newPrefix);

        // Recursão para objetos e arrays aninhados
        if (value !== null && typeof value === 'object') {
          extractPaths(value, newPrefix, paths);
        }
      }
    }
  }

  return paths;
}

// Função para normalizar um caminho para comparação
// Converte [0], [1], etc para [*] e remove variações de namespace
function normalizePath(path) {
  // Substitui [0], [1], [2]... por [*]
  let normalized = path.replace(/\[(\d+)\]/g, '[*]');
  
  return normalized;
}

// Função para verificar se dois caminhos são equivalentes
function pathsMatch(userPath, availablePath) {
  const normalizedUser = normalizePath(userPath);
  const normalizedAvailable = normalizePath(availablePath);
  
  // Comparação direta
  if (normalizedUser === normalizedAvailable) {
    return true;
  }
  
  // Comparação ignorando diferenças de namespace em elementos específicos
  // Ex: getCidadeResponse == ns1:getCidadeResponse
  const userParts = normalizedUser.split(/\.|\[|\]/).filter(p => p && p !== '*');
  const availParts = normalizedAvailable.split(/\.|\[|\]/).filter(p => p && p !== '*');
  
  if (userParts.length !== availParts.length) {
    return false;
  }
  
  for (let i = 0; i < userParts.length; i++) {
    const userPart = userParts[i];
    const availPart = availParts[i];
    
    // Se são iguais, continua
    if (userPart === availPart) {
      continue;
    }
    
    // Verifica se a diferença é só namespace (ns1:name vs name)
    const userWithoutNs = userPart.includes(':') ? userPart.split(':')[1] : userPart;
    const availWithoutNs = availPart.includes(':') ? availPart.split(':')[1] : availPart;
    
    if (userWithoutNs !== availWithoutNs) {
      return false;
    }
  }
  
  return true;
}

// Função para encontrar o melhor match de um path nos paths disponíveis
function findMatchingPath(userPath, availablePaths) {
  // Tenta match exato primeiro
  for (const availPath of availablePaths) {
    if (pathsMatch(userPath, availPath)) {
      return availPath;
    }
  }
  
  // Tenta match sem o prefixo Envelope
  if (userPath.includes('Envelope.')) {
    const withoutEnvelope = userPath.replace(/^[^:]*:Envelope\./, '');
    for (const availPath of availablePaths) {
      if (pathsMatch(withoutEnvelope, availPath)) {
        return availPath;
      }
    }
  }
  
  // Tenta adicionar prefixo Body se não tiver
  if (!userPath.startsWith('SOAP-ENV:Body') && !userPath.startsWith('Body')) {
    const withBody = `SOAP-ENV:Body[*].${userPath}`;
    for (const availPath of availablePaths) {
      if (pathsMatch(withBody, availPath)) {
        return availPath;
      }
    }
  }
  
  return null;
}

// Função para obter o valor em um caminho específico
function getValueAtPath(obj, path) {
  const parts = [];
  let currentPart = '';
  let inBracket = false;
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i];
    
    if (char === '[') {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = '';
      }
      inBracket = true;
    } else if (char === ']') {
      if (currentPart && currentPart !== '*') {
        parts.push(currentPart);
      }
      currentPart = '';
      inBracket = false;
    } else if (char === '.' && !inBracket) {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = '';
      }
    } else {
      currentPart += char;
    }
  }
  
  if (currentPart) {
    parts.push(currentPart);
  }
  
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (Array.isArray(current)) {
      current = current[0];
    }
    
    current = current[part];
  }
  
  // Se o resultado tem propriedade _ (conteúdo de texto do xml2js), retorna isso
  if (current && typeof current === 'object' && '_' in current) {
    return current._;
  }
  
  return current;
}

// Função para detectar o tipo de um valor
function getValueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// Analisar estrutura do responseExample
export const analyzeStructure = async (req, res, next) => {
  try {
    const { endpointId } = req.params;

    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { id: endpointId },
      select: {
        id: true,
        name: true,
        responseExample: true,
        lastTestedAt: true,
      },
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    if (!endpoint.responseExample) {
      return res.json({
        hasExample: false,
        message: 'Nenhum exemplo de resposta disponível. Execute um teste primeiro.',
        paths: [],
      });
    }

    // Extrair todos os caminhos possíveis (filtrando propriedades xml2js)
    const paths = extractPaths(endpoint.responseExample);
    const pathsArray = Array.from(paths).sort();

    // Criar estrutura detalhada para cada caminho
    const detailedPaths = pathsArray.map(path => {
      const value = getValueAtPath(endpoint.responseExample, path);
      const type = getValueType(value);
      const isArray = path.includes('[*]');
      
      return {
        path,
        type,
        isArray,
        sample: type === 'object' ? '[Object]' : type === 'array' ? '[Array]' : value,
      };
    });

    res.json({
      hasExample: true,
      lastTestedAt: endpoint.lastTestedAt,
      totalPaths: pathsArray.length,
      paths: detailedPaths,
      structure: endpoint.responseExample,
    });
  } catch (error) {
    next(error);
  }
};

// Validar se um caminho existe na estrutura
export const validatePath = async (req, res, next) => {
  try {
    const { endpointId } = req.params;
    const { sourcePath, direction } = req.body;

    if (!sourcePath) {
      return res.status(400).json({ error: 'sourcePath é obrigatório' });
    }

    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { id: endpointId },
      select: {
        responseExample: true,
      },
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    if (!endpoint.responseExample) {
      return res.json({
        valid: false,
        reason: 'no_example',
        message: 'Nenhum exemplo de resposta disponível',
      });
    }

    // Para request, não validamos contra responseExample
    if (direction === 'request') {
      return res.json({
        valid: true,
        reason: 'request_mapping',
        message: 'Mapeamentos de request não são validados contra o responseExample',
      });
    }

    // Extrair todos os caminhos válidos
    const validPaths = Array.from(extractPaths(endpoint.responseExample));
    
    // Procurar match flexível
    const matchedPath = findMatchingPath(sourcePath, validPaths);

    if (matchedPath) {
      const value = getValueAtPath(endpoint.responseExample, matchedPath);
      const type = getValueType(value);

      return res.json({
        valid: true,
        type,
        sample: type === 'object' ? '[Object]' : type === 'array' ? '[Array]' : value,
        matchedPath, // Retorna o path real que foi encontrado
        suggestions: [],
      });
    }

    // Se não encontrou, gerar sugestões baseadas em similaridade
    const pathLower = sourcePath.toLowerCase();
    const suggestions = validPaths
      .filter(p => {
        const pLower = p.toLowerCase();
        // Remove namespaces para comparação
        const sourceNoNs = pathLower.replace(/[a-z0-9-]+:/gi, '');
        const pNoNs = pLower.replace(/[a-z0-9-]+:/gi, '');
        return pNoNs.includes(sourceNoNs) || sourceNoNs.includes(pNoNs);
      })
      .slice(0, 5);

    return res.json({
      valid: false,
      reason: 'path_not_found',
      message: `O caminho "${sourcePath}" não foi encontrado na estrutura da resposta`,
      suggestions,
      hint: 'Dica: Use [*] ao invés de [0], e verifique se os namespaces estão corretos (ex: ns1:getCidadeResponse)',
      availablePaths: validPaths.slice(0, 20), // Limita para não sobrecarregar
    });
  } catch (error) {
    next(error);
  }
};

// Sugerir target path baseado no source path
export const suggestTargetPath = async (req, res, next) => {
  try {
    const { endpointId } = req.params;
    const { sourcePath } = req.body;

    if (!sourcePath) {
      return res.status(400).json({ error: 'sourcePath é obrigatório' });
    }

    const endpoint = await prisma.apiEndpoint.findUnique({
      where: { id: endpointId },
      select: {
        responseExample: true,
        fieldMappings: {
          where: { direction: 'response' },
          select: {
            sourcePath: true,
            targetPath: true,
          },
        },
      },
    });

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint não encontrado' });
    }

    // Verificar se já existe um mapping para esse source (com match flexível)
    const validPaths = Array.from(extractPaths(endpoint.responseExample || {}));
    const matchedPath = findMatchingPath(sourcePath, validPaths);
    
    if (matchedPath) {
      const existingMapping = endpoint.fieldMappings.find(m => 
        pathsMatch(m.sourcePath, matchedPath) || pathsMatch(m.sourcePath, sourcePath)
      );

      if (existingMapping) {
        return res.json({
          suggestion: existingMapping.targetPath,
          reason: 'existing_mapping',
          message: 'Já existe um mapeamento para este caminho',
        });
      }
    }

    // Analisar a estrutura e sugerir
    const hasArrayInPath = sourcePath.includes('[*]') || sourcePath.includes('[0]');
    
    // Pegar todos os outros mappings para detectar padrão
    const allTargetPaths = endpoint.fieldMappings.map(m => m.targetPath);
    const hasArrayInTargets = allTargetPaths.some(t => t.includes('[*]'));

    let suggestion = sourcePath;

    // Remove índices fixos e substitui por [*]
    suggestion = suggestion.replace(/\[(\d+)\]/g, '[*]');

    if (hasArrayInPath) {
      if (!hasArrayInTargets) {
        // Nenhum target tem array ainda - sugerir remover o array
        suggestion = suggestion.replace(/\[\*\]/g, '').replace(/\.\./g, '.');
      }
    }

    // Simplificar o nome (remover prefixos comuns e namespaces)
    suggestion = suggestion
      .replace(/^[^:]*:Envelope\./, '')  // Remove Envelope
      .replace(/^SOAP-ENV:Body\[\*\]\./, '')  // Remove Body root
      .replace(/^Body\[\*\]\./, '')
      .replace(/[a-z0-9-]+:/gi, '')  // Remove TODOS os namespaces
      .replace(/^data\./, '')
      .replace(/^response\./, '')
      .replace(/^result\./, '')
      .replace(/^items\./, '');

    return res.json({
      suggestion,
      hasArrayInSource: hasArrayInPath,
      existingArrayMappings: hasArrayInTargets,
      pattern: endpoint.fieldMappings.length > 0 ? 'detected' : 'none',
    });
  } catch (error) {
    next(error);
  }
};