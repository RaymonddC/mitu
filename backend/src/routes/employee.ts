/**
 * Employee Routes
 */

import { Router } from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
} from '../controllers/employeeController';

const router = Router();

/**
 * POST /api/employees
 * Create a new employee
 */
router.post('/', createEmployee);

/**
 * GET /api/employees?employerId=xxx
 * Get all employees for an employer
 */
router.get('/', getEmployees);

/**
 * GET /api/employees/:id
 * Get single employee
 */
router.get('/:id', getEmployee);

/**
 * PUT /api/employees/:id
 * Update employee
 */
router.put('/:id', updateEmployee);

/**
 * DELETE /api/employees/:id
 * Soft delete employee (set active = false)
 */
router.delete('/:id', deleteEmployee);

export default router;
