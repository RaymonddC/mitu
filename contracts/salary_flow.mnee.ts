/**
 * MNEE Flow Contract: Salary Payment System
 *
 * This contract handles autonomous salary payments on MNEE Network
 * Written in TypeScript DSL for MNEE Flow Contracts
 *
 * NOTE: This is a conceptual implementation based on MNEE specs.
 * Actual MNEE Flow SDK syntax may differ. Adjust according to official MNEE documentation.
 */

// MNEE Flow Contract Interface (conceptual)
interface MNEEFlowContract {
  // State variables
  state: {
    employers: Map<string, EmployerData>;
    employees: Map<string, EmployeeData>;
    payrollLogs: PayrollLog[];
    contractOwner: string;
  };

  // Contract methods
  registerEmployer(walletAddress: string, monthlyBudget: number): void;
  registerEmployee(
    employerId: string,
    employeeWallet: string,
    salaryAmount: number
  ): void;
  executeSalary(
    employerId: string,
    employeeWallet: string,
    amount: number
  ): Promise<string>;
  checkFunds(employerId: string): Promise<number>;
  validateEmployer(employerId: string): boolean;
  validateEmployee(employeeWallet: string): boolean;

  // Events
  emit(event: string, data: any): void;
}

// Data structures
interface EmployerData {
  walletAddress: string;
  monthlyBudget: number;
  totalSpentThisMonth: number;
  active: boolean;
  registeredAt: number;
}

interface EmployeeData {
  walletAddress: string;
  employerId: string;
  salaryAmount: number;
  lastPaidAt: number;
  active: boolean;
}

interface PayrollLog {
  employerId: string;
  employeeWallet: string;
  amount: number;
  txHash: string;
  timestamp: number;
  status: 'success' | 'failed';
}

/**
 * SalaryFlowContract - Main Contract Class
 *
 * This contract manages employer registrations, employee records,
 * and executes salary transfers with built-in safety checks.
 */
class SalaryFlowContract implements MNEEFlowContract {
  state = {
    employers: new Map<string, EmployerData>(),
    employees: new Map<string, EmployeeData>(),
    payrollLogs: [] as PayrollLog[],
    contractOwner: '',
  };

  /**
   * Constructor - Initialize contract
   * @param owner - Contract owner address
   */
  constructor(owner: string) {
    this.state.contractOwner = owner;
    this.emit('ContractDeployed', { owner, timestamp: Date.now() });
  }

  /**
   * Register a new employer
   * @param walletAddress - Employer's MNEE wallet
   * @param monthlyBudget - Maximum monthly payroll amount
   */
  registerEmployer(walletAddress: string, monthlyBudget: number): void {
    // Validation
    if (!walletAddress || walletAddress.length < 20) {
      throw new Error('Invalid wallet address');
    }

    if (monthlyBudget <= 0) {
      throw new Error('Monthly budget must be positive');
    }

    if (this.state.employers.has(walletAddress)) {
      throw new Error('Employer already registered');
    }

    // Register employer
    this.state.employers.set(walletAddress, {
      walletAddress,
      monthlyBudget,
      totalSpentThisMonth: 0,
      active: true,
      registeredAt: Date.now(),
    });

    this.emit('EmployerRegistered', {
      walletAddress,
      monthlyBudget,
      timestamp: Date.now(),
    });
  }

  /**
   * Register a new employee
   * @param employerId - Employer's wallet address
   * @param employeeWallet - Employee's MNEE wallet
   * @param salaryAmount - Monthly salary amount
   */
  registerEmployee(
    employerId: string,
    employeeWallet: string,
    salaryAmount: number
  ): void {
    // Validate employer
    if (!this.validateEmployer(employerId)) {
      throw new Error('Employer not found or inactive');
    }

    // Validate employee wallet
    if (!employeeWallet || employeeWallet.length < 20) {
      throw new Error('Invalid employee wallet address');
    }

    if (salaryAmount <= 0) {
      throw new Error('Salary amount must be positive');
    }

    // Check if employee already exists
    if (this.state.employees.has(employeeWallet)) {
      throw new Error('Employee already registered');
    }

    // Register employee
    this.state.employees.set(employeeWallet, {
      walletAddress: employeeWallet,
      employerId,
      salaryAmount,
      lastPaidAt: 0,
      active: true,
    });

    this.emit('EmployeeRegistered', {
      employerId,
      employeeWallet,
      salaryAmount,
      timestamp: Date.now(),
    });
  }

  /**
   * Execute salary payment
   * This is called by the autonomous agent
   *
   * @param employerId - Employer's wallet
   * @param employeeWallet - Employee's wallet
   * @param amount - Amount to transfer
   * @returns Transaction hash
   */
  async executeSalary(
    employerId: string,
    employeeWallet: string,
    amount: number
  ): Promise<string> {
    // Validation checks
    if (!this.validateEmployer(employerId)) {
      this.emit('SalaryFailed', {
        employerId,
        employeeWallet,
        reason: 'Invalid employer',
        timestamp: Date.now(),
      });
      throw new Error('Invalid or inactive employer');
    }

    if (!this.validateEmployee(employeeWallet)) {
      this.emit('SalaryFailed', {
        employerId,
        employeeWallet,
        reason: 'Invalid employee',
        timestamp: Date.now(),
      });
      throw new Error('Invalid or inactive employee');
    }

    const employer = this.state.employers.get(employerId)!;
    const employee = this.state.employees.get(employeeWallet)!;

    // Check if employee belongs to this employer
    if (employee.employerId !== employerId) {
      throw new Error('Employee does not belong to this employer');
    }

    // Check monthly budget cap
    if (employer.totalSpentThisMonth + amount > employer.monthlyBudget) {
      this.emit('InsufficientBudget', {
        employerId,
        required: amount,
        available: employer.monthlyBudget - employer.totalSpentThisMonth,
        timestamp: Date.now(),
      });
      throw new Error('Monthly budget exceeded');
    }

    // Check employer has sufficient funds
    const balance = await this.checkFunds(employerId);
    if (balance < amount) {
      this.emit('InsufficientFunds', {
        employerId,
        required: amount,
        available: balance,
        timestamp: Date.now(),
      });
      throw new Error('Insufficient funds in employer wallet');
    }

    // Execute transfer (this would call MNEE native transfer)
    // In actual implementation, use MNEE SDK transfer method
    const txHash = await this.transferMNEE(employerId, employeeWallet, amount);

    // Update state
    employer.totalSpentThisMonth += amount;
    employee.lastPaidAt = Date.now();

    // Log the payment
    this.state.payrollLogs.push({
      employerId,
      employeeWallet,
      amount,
      txHash,
      timestamp: Date.now(),
      status: 'success',
    });

    // Emit success event
    this.emit('SalaryExecuted', {
      employerId,
      employeeWallet,
      amount,
      txHash,
      timestamp: Date.now(),
    });

    return txHash;
  }

  /**
   * Check employer wallet balance
   * @param employerId - Employer wallet address
   * @returns Current balance in MNEE
   */
  async checkFunds(employerId: string): Promise<number> {
    // TODO: In production, query actual MNEE blockchain
    // const balance = await mneeSDK.getBalance(employerId);
    // return balance;

    // Mock implementation for testing
    return 100000;
  }

  /**
   * Validate employer exists and is active
   */
  validateEmployer(employerId: string): boolean {
    const employer = this.state.employers.get(employerId);
    return employer !== undefined && employer.active;
  }

  /**
   * Validate employee exists and is active
   */
  validateEmployee(employeeWallet: string): boolean {
    const employee = this.state.employees.get(employeeWallet);
    return employee !== undefined && employee.active;
  }

  /**
   * Transfer MNEE tokens
   * @param from - Sender wallet
   * @param to - Recipient wallet
   * @param amount - Amount to transfer
   * @returns Transaction hash
   */
  private async transferMNEE(
    from: string,
    to: string,
    amount: number
  ): Promise<string> {
    // TODO: Replace with actual MNEE SDK transfer call
    // Example:
    // const tx = await mneeSDK.transfer({
    //   from,
    //   to,
    //   amount,
    //   asset: 'MNEE'
    // });
    // return tx.hash;

    // Mock implementation
    const mockTxHash = `mnee_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[MOCK] Transfer ${amount} MNEE from ${from} to ${to}: ${mockTxHash}`);
    return mockTxHash;
  }

  /**
   * Emit contract event
   * Events are logged on-chain for transparency
   */
  emit(event: string, data: any): void {
    console.log(`[EVENT] ${event}:`, data);
    // In production, this would emit an on-chain event
    // that can be queried by the backend and agent
  }

  /**
   * Reset monthly spending (called by agent at month start)
   */
  resetMonthlyBudgets(): void {
    for (const [address, employer] of this.state.employers) {
      employer.totalSpentThisMonth = 0;
    }
    this.emit('MonthlyBudgetsReset', { timestamp: Date.now() });
  }
}

// Export contract class
export default SalaryFlowContract;

/**
 * Usage Example:
 *
 * // Deploy contract
 * const contract = new SalaryFlowContract('mnee1owner_wallet_address');
 *
 * // Register employer
 * contract.registerEmployer('mnee1employer_wallet', 100000);
 *
 * // Register employee
 * contract.registerEmployee('mnee1employer_wallet', 'mnee1employee_wallet', 5000);
 *
 * // Execute salary (called by agent)
 * const txHash = await contract.executeSalary(
 *   'mnee1employer_wallet',
 *   'mnee1employee_wallet',
 *   5000
 * );
 */
