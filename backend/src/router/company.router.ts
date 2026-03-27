import { Router } from 'express';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
} from '../controller/company.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create-company', authenticate, createCompany);

router.get('/all-companies', getAllCompanies);

router.get('/get-company-byId/:id', authenticate, getCompanyById);

router.put('/update-company/:id', authenticate, updateCompany);

router.delete('/delete-company/:id', authenticate, deleteCompany);

export default router;
