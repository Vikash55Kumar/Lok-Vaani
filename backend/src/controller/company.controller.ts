import { Request, Response } from 'express';
import { asyncHandler } from '../utility/asyncHandler';
import ApiResponse from '../utility/ApiResponse';
import { ApiError } from '../utility/ApiError';
import { prisma } from '../db';
import { logSecurityEvent } from '../utility/auditLogger';
import { AuthRequest } from '../utility/types';

// Internal function to create company (can be called from other services)
export async function createCompanyInternal(data: {
  name: string;
  uniNumber: string;
  state: string;
  businessCategoryId: string;
}) {
  const { name, uniNumber, state, businessCategoryId } = data;

  // Check if company already exists
  const existingCompany = await prisma.company.findUnique({
    where: { name }
  });

  if (existingCompany) {
    return existingCompany; // Return existing company instead of throwing error
  }

  // Create new company
  const newCompany = await prisma.company.create({
    data: {
      name,
      uniNumber,
      state,
      businessCategoryId
    }
  });

  if (!newCompany) {
    throw new Error("Failed to create company");
  }

  return newCompany;
}

// Create new company
const createCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if(role !== 'ADMIN' ) {
        throw new ApiError(403, "Forbidden: Admins only");
    }

    const { name, uniNumber, state, businessCategoryId } = req.body;
  
    if (!name || !businessCategoryId || !uniNumber || !state) {
      throw new ApiError(400, "All fields are required");
    }
  
    // Check if company already exists
    const existingCompany = await prisma.company.findUnique({
      where: { name }
    });
  
    if (existingCompany) {
      await logSecurityEvent('COMPANY_CREATION_FAILED', "while create company", { name, reason: 'Company already exists' });
      throw new ApiError(409, "Company already exists with this name");
    }
  
    // Create new company
    const newCompany = await prisma.company.create({
      data: {
        name,
        uniNumber,
        state,
        businessCategoryId
      }
    });
  
    if (!newCompany) {
      await logSecurityEvent('COMPANY_CREATION_FAILED', "while create company", { name, reason: 'Company creation failed' });
      throw new ApiError(500, "Failed to create company");
    }
  
    res.status(201).json(new ApiResponse(201, newCompany, "Company created successfully"));
  } catch (error) {
    await logSecurityEvent('COMPANY_CREATION_FAILED', "while create company", { error });
    throw new ApiError(500, `Failed to create company: ${error}`);
  }
});

// Get all companies
const getAllCompanies = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if(role !== 'ADMIN' ) {
        throw new ApiError(403, "Forbidden: Admins only");
    }

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    });
  
    if (!companies) {
      await logSecurityEvent('COMPANY_FETCH_FAILED', "while fetching companies", {});
      throw new ApiError(500, "Failed to fetch companies");
    }
    res.status(200).json(new ApiResponse(200, companies, "Companies fetched successfully"));
  } catch (error) {
    await logSecurityEvent('COMPANY_FETCH_FAILED', "while fetching companies", { error });
    throw new ApiError(500, `Failed to fetch companies: ${error}`);
  }
});

// Get company by ID
const getCompanyById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if(role !== 'ADMIN' ) {
        throw new ApiError(403, "Forbidden: Admins only");
    }

    const { id } = req.params;
  
    const company = await prisma.company.findUnique({
      where: { id }
    });
  
    if (!company) {
      await logSecurityEvent('COMPANY_FETCH_FAILED', "while fetching company", { id, reason: 'Company not found' });
      throw new ApiError(404, "Company not found");
    }
  
    res.status(200).json(new ApiResponse(200, company, "Company fetched successfully"));
  } catch (error) {
    await logSecurityEvent('COMPANY_FETCH_FAILED', "while fetching company", { id: req.params.id, reason: error });
    throw new ApiError(500, `Failed to fetch company: ${error}`);
  }
});

// Update company
const updateCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;

  if(role !== 'ADMIN' ) {
      throw new ApiError(403, "Forbidden: Admins only");
  }

  const { id } = req.params;
  const { name, uniNumber, state, businessCategoryId } = req.body;

  if (!name || !businessCategoryId || !uniNumber || !state) {
    throw new ApiError(400, "All fields are required");
  }

  const company = await prisma.company.findUnique({
    where: { id }
  });

  if (!company) {
    await logSecurityEvent('COMPANY_UPDATE_FAILED', "while updating company", { id, reason: 'Company not found' });
    throw new ApiError(404, "Company not found");
  }

  const updatedCompany = await prisma.company.update({
    where: { id },
    data: {
      name,
      uniNumber,
      state,
      businessCategoryId
    }
  });

  if (!updatedCompany) {
    await logSecurityEvent('COMPANY_UPDATE_FAILED', "while updating company", { id, reason: 'Company update failed' });
    throw new ApiError(500, "Failed to update company");
  }

  res.status(200).json(new ApiResponse(200, updatedCompany, "Company updated successfully"));
});

// Delete company
const deleteCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;

    if(role !== 'ADMIN' ) {
        throw new ApiError(403, "Forbidden: Admins only");
    }

    const { id } = req.params;
  
    const company = await prisma.company.findUnique({
      where: { id }
    });
  
    if (!company) {
      await logSecurityEvent('COMPANY_DELETE_FAILED', "while deleting company", { id, reason: 'Company not found' });
      throw new ApiError(404, "Company not found");
    }
  
    const deletedCompany = await prisma.company.delete({
      where: { id }
    });
  
    if (!deletedCompany) {
      await logSecurityEvent('COMPANY_DELETE_FAILED', "while deleting company", { id, reason: 'Company deletion failed' });
      throw new ApiError(500, "Failed to delete company");
    }
  
    res.status(200).json(new ApiResponse(200, deletedCompany, "Company deleted successfully"));
  } catch (error) {
    await logSecurityEvent('COMPANY_DELETE_FAILED', "while deleting company", { id: req.params.id, reason: error });
    throw new ApiError(500, `Failed to delete company: ${error}`);
  }
});

export {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};