import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDTO {
  @ApiProperty({ example: 'contato@fontinele.dev', description: 'E-mail do usuário' })
  @IsEmail()
  email: string;
  @ApiProperty({ example: '123456', description: 'Senha do usuário' })
  @IsString()
  @MinLength(6)
  password: string;
}