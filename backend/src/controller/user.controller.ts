import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import bcrypt from 'bcrypt';
import { logAuth, logSecurityEvent } from '../utility/auditLogger';
import { generateToken } from '../utility/jwt';
import { AuthRequest } from '../utility/types';

// User Registration
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { name, email, role = 'ANALYST', password } = req.body;

        if (!name || !email || !password) {
            throw new ApiError(400, "All fields are required");
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ApiError(400, "Invalid email format.");
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new ApiError(409, "User already exists with this email");
        }

        //  Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                role,
                password: passwordHash
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role
        }); 

        if (!newUser) {
            await logAuth('REGISTRATION_FAILED', "while register user", { email, reason: 'User creation failed' });
            throw new ApiError(500, "Failed to register user");
        }

        // Log the registration
        await logAuth('REGISTRATION_SUCCESS', newUser.id, {
            email,
            role
        });

        return res.status(201).json(
            new ApiResponse(201, {newUser, token}, "User registered successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to register user: ${error}`);
    }
});

// User Login
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt for email:", email, password);
        
        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true
            }
        });

        if (!user) {
            await logAuth('LOGIN_FAILED', "user not found", { email, reason: 'User not found' });
            throw new ApiError(401, "Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            await logAuth('LOGIN_FAILED', user.id, { email, reason: 'Invalid password' });
            throw new ApiError(401, "Invalid email or password");
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        // Log successful login
        await logAuth('LOGIN_SUCCESS', user.id, { email });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return res.status(200).json(
            new ApiResponse(200, {
                user: userWithoutPassword,
                token
            }, "Login successful")
        );

    } catch (error) {
        throw new ApiError(500, `Login failed: ${error}`);
    }
});

// Get User Profile
export const getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
        const id = req.user?.id;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        return res.status(200).json(
            new ApiResponse(200, user, "User profile retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve user profile: ${error}`);
    }
});

// Update User Profile
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, email, role } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            throw new ApiError(404, "User not found");
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                updatedAt: true
            }
        });

        return res.status(200).json(
            new ApiResponse(200, updatedUser, "User profile updated successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to update user profile: ${error}`);
    }
});

// Get All Users (Admin only)
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role,
            search 
        } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Build where clause
        const whereClause: any = {};
        
        if (role) whereClause.role = role;
        if (search) {
            whereClause.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit as string)
            }),
            prisma.user.count({ where: whereClause })
        ]);

        return res.status(200).json(
            new ApiResponse(200, {
                users,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    pages: Math.ceil(total / parseInt(limit as string))
                }
            }, "Users retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve users: ${error}`);
    }
});

// Change Password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { currentPassword, newPassword } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                password: true
            }
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            throw new ApiError(400, "Current password is incorrect");
        }

        // const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        const hashedNewPassword = newPassword; // Temporary

        // Update password
        await prisma.user.update({
            where: { id },
            data: { password: hashedNewPassword }
        });

        // Log password change
        await logSecurityEvent('PASSWORD_CHANGED', id);

        return res.status(200).json(
            new ApiResponse(200, null, "Password changed successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to change password: ${error}`);
    }
});
