import dotenv from 'dotenv';
import app from './app.js';
import prisma from './config/database.js';

// Carregar variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 5000;

// Verificar conexão com o banco de dados
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados estabelecida');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Iniciar servidor
async function startServer() {
  await checkDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
