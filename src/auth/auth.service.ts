import { Logger, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    async login(username: string, password: string): Promise<{ token: string }> {
        this.logger.log(`Login attempt for user: ${username}`);
        try{
             // Find user by username
            const user = await this.userModel.findOne({ username });
            if (!user) {
                this.logger.warn(`Login failed: User not found - ${username}`);
                throw new UnauthorizedException('Invalid credentials');
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                this.logger.warn(`Login failed: Invalid password for user - ${username}`);
                throw new UnauthorizedException('Invalid credentials');
            }

            this.logger.log(`Login successful for user: ${username}`);
            // For now, return a simple success message
            // In a real application, you would generate and return a JWT token here
            return { token: 'authenticated' };
        } catch (error) {
            this.logger.error(`Login error for user ${username}: ${error.message}`, error.stack);
            throw error;
        }
       
    }

    // Helper method to create a user (for testing purposes)
    async createUser(username: string, password: string): Promise<User> {
        const existingUser = await this.userModel.findOne({ username });
        if (existingUser) {
            throw new UnauthorizedException('Username already exists');
        }

        const user = new this.userModel({
            username,
            password, // Will be hashed by the schema pre-save middleware
        });

        return user.save();
    }
}
