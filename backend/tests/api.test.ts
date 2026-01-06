/**
 * Backend API Tests
 * Basic integration tests for core endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('MNEE Payroll Backend API', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3001';

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
    });
  });

  describe('Employer API', () => {
    it('should create a new employer', async () => {
      const newEmployer = {
        walletAddress: `mnee1test_${Date.now()}`,
        companyName: 'Test Company',
        email: 'test@example.com',
        payrollDay: 15
      };

      const response = await fetch(`${API_URL}/api/employers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployer)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.companyName).toBe('Test Company');
    });
  });

  describe('Employee API', () => {
    it('should require employerId when listing employees', async () => {
      const response = await fetch(`${API_URL}/api/employees`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
