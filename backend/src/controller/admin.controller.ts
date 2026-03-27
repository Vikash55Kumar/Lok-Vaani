import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { logSecurityEvent } from '../utility/auditLogger';
import { AuthRequest } from '../utility/types';

// Dashboard Analytics - Get overview statistics for MCA e-consultation
const getDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
        // Parallel queries for dashboard metrics based on our actual schema
        const [
            totalUsers,
            totalPosts,
            totalComments,
            totalCompanies,
            totalBusinessCategories,
            recentComments,
            commentsByStatus,
            commentsBySentiment,
            postsAnalytics
        ] = await Promise.all([
            // User metrics
            prisma.user.count(),
            
            // Content metrics
            prisma.post.count(),
            prisma.comment.count(),
            prisma.company.count(),
            prisma.businessCategory.count(),
            
            // Recent activity
            prisma.comment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    post: {
                        select: { title: true }
                    }
                }
            }),
            
            // Comment status breakdown
            prisma.comment.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            
            // Sentiment analysis
            prisma.comment.groupBy({
                by: ['sentiment'],
                _count: { id: true },
                where: {
                    sentiment: { not: null }
                }
            }),
            
            // Posts analytics
            prisma.post.groupBy({
                by: ['status'],
                _count: { id: true }
            })
        ]);

        // Format statistics
        const analytics = {
            overview: {
                totalUsers,
                totalPosts,
                totalComments,
                totalCompanies,
                totalBusinessCategories
            },
            comments: {
                byStatus: commentsByStatus.reduce((acc, item) => {
                    acc[item.status] = item._count.id;
                    return acc;
                }, {} as Record<string, number>),
                bySentiment: commentsBySentiment.reduce((acc, item) => {
                    acc[item.sentiment || 'UNLABELED'] = item._count.id;
                    return acc;
                }, {} as Record<string, number>)
            },
            posts: {
                byStatus: postsAnalytics.reduce((acc, item) => {
                    acc[item.status] = item._count.id;
                    return acc;
                }, {} as Record<string, number>)
            },
            recentActivity: recentComments,
            systemHealth: {
                dbConnection: true,
                lastUpdated: new Date().toISOString()
            }
        };

        return res.status(200).json(
            new ApiResponse(200, analytics, "Dashboard analytics retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve analytics: ${error}`);
    }
});

// Comment Analytics - Get detailed comment patterns and trends
const getCommentAnalytics = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { period = '30', postId } = req.query;
        
        const periodDays = parseInt(period as string);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        const whereClause: any = {
            createdAt: { gte: startDate }
        };
        
        if (postId) {
            whereClause.postId = postId;
        }

        // Get comments with analytics
        const [comments, sentimentDistribution, commentsWithCategories] = await Promise.all([
            prisma.comment.findMany({
                where: whereClause,
                include: {
                    post: {
                        select: { title: true, postType: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            
            prisma.comment.groupBy({
                by: ['sentiment'],
                _count: { id: true },
                where: whereClause
            }),
            
            prisma.comment.findMany({
                where: whereClause,
                include: {
                    company: {
                        include: {
                            businessCategory: true
                        }
                    }
                }
            })
        ]);

        // Process category breakdown from comments with categories
        const categoryBreakdown = commentsWithCategories.reduce((acc: any, comment: any) => {
            const categoryName = comment.company?.businessCategory?.name || 'UNKNOWN';
            if (!acc[categoryName]) {
                acc[categoryName] = { 
                    category: categoryName,
                    count: 0,
                    weightage: comment.company?.businessCategory?.weightageScore || 0
                };
            }
            acc[categoryName].count++;
            return acc;
        }, {});

        const analytics = {
            summary: {
                totalComments: comments.length,
                period: `${periodDays} days`,
                dateRange: {
                    from: startDate.toISOString(),
                    to: new Date().toISOString()
                }
            },
            sentiment: sentimentDistribution,
            categories: Object.values(categoryBreakdown),
            timeline: comments.reduce((acc, comment) => {
                const date = comment.createdAt.toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = { date, count: 0, positive: 0, negative: 0, neutral: 0 };
                }
                acc[date].count++;
                if (comment.sentiment === 'POSITIVE') acc[date].positive++;
                else if (comment.sentiment === 'NEGATIVE') acc[date].negative++;
                else if (comment.sentiment === 'NEUTRAL') acc[date].neutral++;
                return acc;
            }, {} as Record<string, any>)
        };

        return res.status(200).json(
            new ApiResponse(200, analytics, "Comment analytics retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve comment analytics: ${error}`);
    }
});

// Business Category Management
const createBusinessCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;

        if(role !== 'ADMIN') {
            throw new ApiError(403, "Forbidden: Admins only");
        }

        const { name, weightageScore = 1.0, categoryType = 'BUSINESS' } = req.body;

        // Check if category already exists
        const existingCategory = await prisma.businessCategory.findUnique({
            where: { name }
        });

        if (existingCategory) {
            throw new ApiError(409, "Business category already exists");
        }

        const newCategory = await prisma.businessCategory.create({
            data: {
                name,
                weightageScore,
                categoryType
            }
        });

        if (!newCategory) {
            throw new ApiError(500, "Failed to create business category");
        }

        // Log the action
        return res.status(201).json(
            new ApiResponse(201, newCategory, "Business category created successfully")
        );
        
    } catch (error) {
        throw new ApiError(500, `Failed to create business category: ${error}`);
    }
});

const updateBusinessCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;

        if(role !== 'ADMIN') {
            throw new ApiError(403, "Forbidden: Admins only");
        }

        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, weightageScore, categoryType } = req.body;
        const userId = 'admin'; // TODO: Get from authenticated user

        // Check if category exists
        const existingCategory = await prisma.businessCategory.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            throw new ApiError(404, "Business category not found");
        }

        const updatedCategory = await prisma.businessCategory.update({
            where: { id },
            data: {
                name,
                weightageScore,
                categoryType,
                updatedAt: new Date()
            }
        });

        if (!updatedCategory) {
            throw new ApiError(500, "Failed to update business category");
        }

        return res.status(200).json(
            new ApiResponse(200, updatedCategory, "Business category updated successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to update business category: ${error}`);
    }
});

const deleteBusinessCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;

        if(role !== 'ADMIN') {
            throw new ApiError(403, "Forbidden: Admins only");
        }

        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        // Check if category exists
        const existingCategory = await prisma.businessCategory.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            throw new ApiError(404, "Business category not found");
        }

        // Check if category is being used by any companies
        const companiesUsingCategory = await prisma.company.count({
            where: { businessCategoryId: id }
        });

        if (companiesUsingCategory > 0) {
            throw new ApiError(400, `Cannot delete category: ${companiesUsingCategory} companies are using this category`);
        }

        const deletedCategory = await prisma.businessCategory.delete({
            where: { id }
        });

        if (!deletedCategory) {
            throw new ApiError(500, "Failed to delete business category");
        }

        return res.status(200).json(
            new ApiResponse(200, null, "Business category deleted successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to delete business category: ${error}`);
    }
});

// Get all Categories
const getAllCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;
        
        if(role !== 'ADMIN') {
            throw new ApiError(403, "Forbidden: Admins only");
        }

        const categories = await prisma.businessCategory.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json(
            new ApiResponse(200, categories, "Business categories retrieved successfully")
        );
    } catch (error) {
        throw new ApiError(500, `Failed to retrieve business categories: ${error}`);    
    }
})

// Bulk Category operations
const bulkImportBusinessCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;

        if(role !== 'ADMIN') {
            throw new ApiError(403, "Forbidden: Admins only");
        }

        const { categories } = req.body; // Array of category objects

        if (!Array.isArray(categories) || categories.length === 0) {
            throw new ApiError(400, "Invalid categories data");
        }

        // Validate and prepare data
        const validCategories = categories.filter((item: any) => 
            item.name && typeof item.weightageScore === 'number'
        );

        if (validCategories.length === 0) {
            throw new ApiError(400, "No valid categories found");
        }

        // Bulk create with duplicate handling
        const createdCategories = await Promise.all(
            validCategories.map(async (categoryData: any) => {
                try {
                    return await prisma.businessCategory.create({
                        data: categoryData
                    });
                } catch (error) {
                    // Skip duplicates
                    return null;
                }
            })
        );

        const successCount = createdCategories.filter((cat: any) => cat !== null).length;

        // Log the action
        if (successCount > 0) {
            throw new ApiError(500, "Failed to bulk import business categories");
        }

        return res.status(201).json(
            new ApiResponse(201, {
                imported: successCount,
                total: categories.length,
                failed: categories.length - successCount    
            }, "Business categories bulk import completed")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to bulk import business categories: ${error}`);
    }
});

// System Configuration Management (using simple key-value approach)
const getSystemConfigs = asyncHandler(async (req: Request, res: Response) => {
    try {
        // Since we don't have a systemConfig table, return default configurations
        const configs = [
            {
                key: 'ai_processing_enabled',
                value: 'true',
                description: 'Enable AI processing for comments',
                dataType: 'boolean'
            },
            {
                key: 'sentiment_threshold',
                value: '0.7',
                description: 'Minimum confidence score for sentiment analysis',
                dataType: 'number'
            },
            {
                key: 'max_comments_per_post',
                value: '1000',
                description: 'Maximum number of comments allowed per post',
                dataType: 'number'
            },
            {
                key: 'default_language',
                value: 'ENGLISH',
                description: 'Default language for posts',
                dataType: 'string'
            }
        ];

        return res.status(200).json(
            new ApiResponse(200, configs, "System configurations retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve system configurations: ${error}`);
    }
});

const updateSystemConfig = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { key, value, description, dataType = 'string' } = req.body;
        const userId = 'admin'; // TODO: Get from authenticated user

        const config = {
            key,
            value,
            description,
            dataType,
            updatedAt: new Date().toISOString()
        };

        return res.status(200).json(
            new ApiResponse(200, config, "System configuration updated successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to update system configuration: ${error}`);
    }
});

// Processing Queue Management
const getProcessingQueueStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            status,
            priority 
        } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Build where clause
        const whereClause: any = {};
        
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = parseInt(priority as string);

        const [queueItems, total] = await Promise.all([
            prisma.processingQueue.findMany({
                where: whereClause,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'asc' }
                ],
                skip,
                take: parseInt(limit as string)
            }),
            prisma.processingQueue.count({ where: whereClause })
        ]);

        return res.status(200).json(
            new ApiResponse(200, {
                queueItems,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    pages: Math.ceil(total / parseInt(limit as string))
                }
            }, "Processing queue status retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve processing queue status: ${error}`);
    }
});

// Get Audit Logs with filtering and pagination
const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
    try {
        const {
            category,
            action,
            userId,
            entityType,
            success,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        const options = {
            category: category as string,
            action: action as string,
            userId: userId as string,
            entityType: entityType as string,
            success: success === 'true' ? true : success === 'false' ? false : undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: parseInt(limit as string),
            offset
        };

        // Import the function dynamically to avoid circular dependency
        const { getAuditLogs: getAuditLogsUtil } = await import('../utility/auditLogger');
        const { logs, total } = await getAuditLogsUtil(options);

        return res.status(200).json(
            new ApiResponse(200, {
                logs,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    pages: Math.ceil(total / parseInt(limit as string))
                }
            }, "Audit logs retrieved successfully")
        );

    } catch (error) {
        throw new ApiError(500, `Failed to retrieve audit logs: ${error}`);
    }
});

export {
    getDashboardAnalytics,
    getCommentAnalytics,
    createBusinessCategory,
    getAllCategories,
    updateBusinessCategory,
    deleteBusinessCategory,
    bulkImportBusinessCategories,
    getSystemConfigs,
    updateSystemConfig,
    getProcessingQueueStatus,
    getAuditLogs
};
