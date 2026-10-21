import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SELLER = 'seller',
}

export class RegisterDTO {
  @ApiProperty({ example: 'contato@fontinele.dev', description: 'E-mail do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha do usuário' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John', description: 'Primeiro nome do usuário' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Sobrenome do usuário' }) 
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  role?: Role;
}