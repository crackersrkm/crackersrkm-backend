import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Customer } from './customers/entities/customer.entity';
import { Bill } from './bills/entities/bill.entity';
import { BillItem } from './bills/entities/bill-item.entity';
import { Payment } from './bills/entities/payment.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { BillsModule } from './bills/bills.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'rkm_crackers'),
        password: configService.get<string>('DB_PASSWORD', 'crackersrkm2026'),
        database: configService.get<string>('DB_NAME', 'rkm_crackers'),
        entities: [User, Product, Customer, Bill, BillItem, Payment],
        synchronize: true, // Automatically synchronize schema in dev
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ProductsModule,
    BillsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
