import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    async login(username: string, password: string): Promise<{ token: string }> {
        // Find user by username
        const user = await this.userModel.findOne({ username });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // For now, return a simple success message
        // In a real application, you would generate and return a JWT token here
        return { token: 'authenticated' };
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
