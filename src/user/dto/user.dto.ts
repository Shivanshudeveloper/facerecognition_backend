import { IsUUID, IsEmail, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
    @IsUUID()
    id: string;

    @Type(() => Date)
    created_at: Date;

    @IsEmail()
    email: string;

    password: string;

    @IsOptional()
    @Type(() => Object)
    metadata: Record<string, any>;
}
