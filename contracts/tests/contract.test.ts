/**
 * MNEE Flow Contract Tests
 * Unit tests for salary_flow contract logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import SalaryFlowContract from '../salary_flow.mnee';

describe('SalaryFlowContract', () => {
  let contract: SalaryFlowContract;
  const ownerAddress = 'mnee1owner_test_address';
  const employerAddress = 'mnee1employer_test_address';
  const employeeAddress = 'mnee1employee_test_address';

  beforeEach(() => {
    contract = new SalaryFlowContract(ownerAddress);
  });

  describe('Employer Registration', () => {
    it('should register a new employer', () => {
      contract.registerEmployer(employerAddress, 100000);

      expect(contract.validateEmployer(employerAddress)).toBe(true);
    });

    it('should reject duplicate employer registration', () => {
      contract.registerEmployer(employerAddress, 100000);

      expect(() => {
        contract.registerEmployer(employerAddress, 100000);
      }).toThrow('Employer already registered');
    });

    it('should reject invalid wallet address', () => {
      expect(() => {
        contract.registerEmployer('invalid', 100000);
      }).toThrow('Invalid wallet address');
    });

    it('should reject negative budget', () => {
      expect(() => {
        contract.registerEmployer(employerAddress, -1000);
      }).toThrow('Monthly budget must be positive');
    });
  });

  describe('Employee Registration', () => {
    beforeEach(() => {
      contract.registerEmployer(employerAddress, 100000);
    });

    it('should register a new employee', () => {
      contract.registerEmployee(employerAddress, employeeAddress, 5000);

      expect(contract.validateEmployee(employeeAddress)).toBe(true);
    });

    it('should reject employee for non-existent employer', () => {
      expect(() => {
        contract.registerEmployee('mnee1nonexistent', employeeAddress, 5000);
      }).toThrow('Employer not found or inactive');
    });

    it('should reject duplicate employee', () => {
      contract.registerEmployee(employerAddress, employeeAddress, 5000);

      expect(() => {
        contract.registerEmployee(employerAddress, employeeAddress, 5000);
      }).toThrow('Employee already registered');
    });
  });

  describe('Salary Execution', () => {
    beforeEach(() => {
      contract.registerEmployer(employerAddress, 100000);
      contract.registerEmployee(employerAddress, employeeAddress, 5000);
    });

    it('should execute salary payment successfully', async () => {
      const txHash = await contract.executeSalary(
        employerAddress,
        employeeAddress,
        5000
      );

      expect(txHash).toBeDefined();
      expect(typeof txHash).toBe('string');
    });

    it('should reject payment for invalid employer', async () => {
      await expect(
        contract.executeSalary('mnee1invalid', employeeAddress, 5000)
      ).rejects.toThrow('Invalid or inactive employer');
    });

    it('should reject payment for mismatched employee-employer', async () => {
      const anotherEmployer = 'mnee1another_employer';
      contract.registerEmployer(anotherEmployer, 100000);

      await expect(
        contract.executeSalary(anotherEmployer, employeeAddress, 5000)
      ).rejects.toThrow('Employee does not belong to this employer');
    });
  });
});
