import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      password: hashedPassword,
    },
  });

  console.log('✅ Usuário admin criado:', { username: admin.username });

  // Criar integração de exemplo
  const integration = await prisma.integration.create({
    data: {
      name: 'CRM XPTO',
      description: 'Integração com o sistema CRM XPTO para sincronização de clientes',
    },
  });

  console.log('✅ Integração de exemplo criada:', integration.name);

  // Criar endpoint de exemplo
  const endpoint = await prisma.apiEndpoint.create({
    data: {
      integrationId: integration.id,
      name: 'Criar Cliente',
      httpMethod: 'POST',
      url: 'https://api.crm-xpto.com/v1/customers',
      headersTemplate: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {{token}}'
      },
      authenticationType: 'Bearer Token',
    },
  });

  console.log('✅ Endpoint de exemplo criado:', endpoint.name);

  // Criar mapeamentos de exemplo
  await prisma.fieldMapping.createMany({
    data: [
      {
        endpointId: endpoint.id,
        direction: 'request',
        sourcePath: 'data.customer.name',
        targetPath: 'customer.fullName',
      },
      {
        endpointId: endpoint.id,
        direction: 'request',
        sourcePath: 'data.customer.email',
        targetPath: 'customer.email',
      },
      {
        endpointId: endpoint.id,
        direction: 'response',
        sourcePath: 'customer.id',
        targetPath: 'data.customerId',
      },
    ],
  });

  console.log('✅ Mapeamentos de exemplo criados');
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log(`\n📝 Credenciais de acesso:\n   Username: ${adminUsername}\n   Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
