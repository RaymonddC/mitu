/**
 * Wallet Signing Routes
 * Non-custodial wallet signing endpoints for payroll approvals
 */

import { Router } from 'express';
import { walletSigningController } from '../controllers/walletSigningController';

const router = Router();

// Approval endpoints
router.post('/approvals/create', walletSigningController.createApproval.bind(walletSigningController));
router.get('/approvals/:approvalId', walletSigningController.getApproval.bind(walletSigningController));
router.get('/approvals', walletSigningController.listApprovals.bind(walletSigningController));
router.post('/approvals/:approvalId/submit', walletSigningController.submitSignedTransaction.bind(walletSigningController));
router.post('/approvals/:approvalId/reject', walletSigningController.rejectApproval.bind(walletSigningController));

// Budget endpoints
router.post('/budgets', walletSigningController.createBudget.bind(walletSigningController));
router.get('/budgets/:employerId', walletSigningController.getEmployerBudgets.bind(walletSigningController));
router.post('/budgets/:employerId/check', walletSigningController.checkBudgetAuthorization.bind(walletSigningController));

export default router;
