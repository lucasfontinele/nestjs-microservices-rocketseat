import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const databaseConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "checkout_service",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: true, // Set to false in production
};