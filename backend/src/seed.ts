import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { UserRepository } from './domain/repositories/user.repository';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get(UserRepository);
  const config = app.get(ConfigService);

  const adminPassword = config.get<string>('SEED_ADMIN_PASSWORD', 'admin123');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await userRepository.upsertByUsername('admin', {
    username: 'admin',
    password: hashedPassword,
    full_name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    gender: 'male',
    join_date: new Date(),
  });

  console.log('✓ Admin user seeded (username: admin)');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
