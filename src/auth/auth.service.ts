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
        try {
            // Find user by username - use lean: false to ensure we get a full Mongoose document
            const user = await this.userModel.findOne({ username }).exec();
            if (!user) {
                this.logger.warn(`Login failed: User not found - ${username}`);
                throw new UnauthorizedException('Invalid credentials');
            }
    
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                this.logger.warn(`Login failed: Invalid password for user - ${username}`);
                throw new UnauthorizedException('Invalid credentials');
            }
    
            this.logger.log(`Login successful for user: ${username}`);
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
