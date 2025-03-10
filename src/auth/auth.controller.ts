import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiKeyGuard } from './api-key.guard';
import { UseGuards } from '@nestjs/common';

interface LoginDto {
    username: string;
    password: string;
}

@Controller('api/auth')
@UseGuards(ApiKeyGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(
        @Body() loginDto: LoginDto,
        @Headers('x-api-key') apiKey: string,
    ) {
        // Validate request body
        if (!loginDto.username || !loginDto.password) {
            throw new BadRequestException('Username and password are required');
        }

        if (!apiKey) {
            throw new UnauthorizedException('API key is required');
        }

        try {
            return await this.authService.login(loginDto.username, loginDto.password);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException('Login failed');
        }
    }

    // Development endpoint to create a test user
    @Post('create')
    async createUser(
        @Body() createUserDto: LoginDto,
        @Headers('x-api-key') apiKey: string,
    ) {
        if (!createUserDto.username || !createUserDto.password) {
            throw new BadRequestException('Username and password are required');
        }

        if (!apiKey) {
            throw new UnauthorizedException('API key is required');
        }

        try {
            const user = await this.authService.createUser(
                createUserDto.username,
                createUserDto.password,
            );
            return { message: 'User created successfully', username: user.username };
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException('User creation failed');
        }
    }
}
