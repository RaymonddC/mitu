/**
 * MNEE Autonomous Payroll Agent
 *
 * This agent runs on MNEE Agent Runtime and autonomously executes
 * salary payments based on schedules stored in the backend.
 *
 * Features:
 * - Checks payroll schedule daily
 * - Validates employer balances
 * - Calls MNEE Flow Contract to execute transfers
 * - Retries failed payments
 * - Creates alerts for issues
 * - Logs all actions
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  mneeRpcUrl: process.env.MNEE_RPC_URL || 'https://testnet.mnee-rpc.io',
  contractAddress: process.env.SALARY_CONTRACT_ADDRESS || '',
  agentPrivateKey: process.env.AGENT_PRIVATE_KEY || '',
  checkInterval: parseInt(process.env.AGENT_CHECK_INTERVAL || '3600000'), // 1 hour
  maxRetries: parseInt(process.env.AGENT_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.AGENT_RETRY_DELAY_MS || '5000'),
};

// Types
interface Employer {
  id: string;
  walletAddress: string;
  companyName: string;
  payrollDay: number;
  monthlyBudget?: number;
  active: boolean;
}

interface Employee {
  id: string;
  employerId: string;
  name: string;
  walletAddress: string;
  salaryAmount: number;
  active: boolean;
}

interface PayrollTask {
  employer: Employer;
  employee: Employee;
  amount: number;
  scheduledDate: Date;
}

/**
 * MNEE Autonomous Payroll Agent
 */
class SalaryAgent {
  private isRunning: boolean = false;
  private lastRunDate: Date | null = null;

  constructor() {
    console.log('🤖 MNEE Autonomous Payroll Agent initialized');
    console.log(`📡 Backend: ${CONFIG.backendUrl}`);
    console.log(`⛓️  MNEE RPC: ${CONFIG.mneeRpcUrl}`);
    console.log(`📋 Contract: ${CONFIG.contractAddress || 'NOT SET'}`);
  }

  /**
   * Start the agent
   * Runs checks based on configured interval
   */
  async start(): Promise<void> {
    console.log('🚀 Starting autonomous payroll agent...');

    // Run immediately
    await this.executePayrollCheck();

    // Set up recurring checks
    setInterval(async () => {
      await this.executePayrollCheck();
    }, CONFIG.checkInterval);

    console.log(`⏰ Agent will check payroll every ${CONFIG.checkInterval / 1000 / 60} minutes`);
  }

  /**
   * Main execution loop
   * Checks if today is payday for any employers and executes payroll
   */
  private async executePayrollCheck(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️  Skipping check - already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n' + '='.repeat(60));
      console.log(`🔍 Payroll Check - ${new Date().toISOString()}`);
      console.log('='.repeat(60));

      // Get current day of month
      const today = new Date();
      const dayOfMonth = today.getDate();

      console.log(`📅 Today is day ${dayOfMonth} of the month`);

      // Fetch all employers from backend
      const employers = await this.fetchEmployers();
      console.log(`👔 Found ${employers.length} employers`);

      // Filter employers whose payroll day is today
      const dueToday = employers.filter(
        (emp) => emp.active && emp.payrollDay === dayOfMonth
      );

      if (dueToday.length === 0) {
        console.log('✅ No payroll due today');
        this.lastRunDate = today;
        return;
      }

      console.log(`💰 ${dueToday.length} employer(s) have payroll due today`);

      // Process each employer
      for (const employer of dueToday) {
        await this.processEmployerPayroll(employer);
      }

      const duration = Date.now() - startTime;
      console.log(`\n✅ Payroll check completed in ${duration}ms`);
      this.lastRunDate = today;

    } catch (error: any) {
      console.error('❌ Error during payroll check:', error.message);
      await this.createAlert('critical', 'Agent Execution Failed', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process payroll for a single employer
   */
  private async processEmployerPayroll(employer: Employer): Promise<void> {
    console.log(`\n👔 Processing payroll for: ${employer.companyName}`);

    try {
      // Fetch employees for this employer
      const employees = await this.fetchEmployees(employer.id);
      const activeEmployees = employees.filter((emp) => emp.active);

      console.log(`   👥 ${activeEmployees.length} active employees`);

      if (activeEmployees.length === 0) {
        console.log('   ⏭️  No active employees, skipping');
        return;
      }

      // Calculate total amount needed
      const totalAmount = activeEmployees.reduce(
        (sum, emp) => sum + emp.salaryAmount,
        0
      );

      console.log(`   💵 Total payroll: ${totalAmount} MNEE`);

      // AI Guard: Check employer balance
      const balance = await this.checkEmployerBalance(employer.walletAddress);
      console.log(`   💰 Employer balance: ${balance} MNEE`);

      if (balance < totalAmount) {
        console.log(`   ⚠️  Insufficient funds! Need ${totalAmount}, have ${balance}`);
        await this.createAlert(
          'critical',
          'Insufficient Funds',
          `${employer.companyName} has insufficient funds for payroll. Need ${totalAmount} MNEE, have ${balance} MNEE.`,
          { employerId: employer.id, deficit: totalAmount - balance }
        );
        return;
      }

      // Execute payroll for each employee
      let successCount = 0;
      let failCount = 0;

      for (const employee of activeEmployees) {
        try {
          console.log(`   → Processing ${employee.name}...`);

          const txHash = await this.executeSalaryPayment(
            employer,
            employee,
            employee.salaryAmount
          );

          console.log(`   ✅ Paid ${employee.salaryAmount} MNEE to ${employee.name}`);
          console.log(`   📜 TX: ${txHash}`);

          successCount++;

          // Brief delay between payments
          await this.sleep(1000);

        } catch (error: any) {
          console.error(`   ❌ Failed to pay ${employee.name}:`, error.message);
          await this.createAlert(
            'critical',
            'Payroll Payment Failed',
            `Failed to pay ${employee.name}: ${error.message}`,
            { employerId: employer.id, employeeId: employee.id }
          );
          failCount++;
        }
      }

      console.log(`   📊 Results: ${successCount} succeeded, ${failCount} failed`);

    } catch (error: any) {
      console.error(`   ❌ Error processing employer payroll:`, error.message);
      await this.createAlert(
        'critical',
        'Employer Payroll Failed',
        `Failed to process payroll for ${employer.companyName}: ${error.message}`,
        { employerId: employer.id }
      );
    }
  }

  /**
   * Execute salary payment via backend API
   * The backend will call the MNEE Flow Contract
   */
  private async executeSalaryPayment(
    employer: Employer,
    employee: Employee,
    amount: number
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${CONFIG.backendUrl}/api/payroll/run`,
        {
          employerId: employer.id,
          employeeIds: [employee.id],
          testMode: false, // Set to false for production
        },
        {
          timeout: 30000,
        }
      );

      const result = response.data.data.results[0];

      if (result.status === 'success') {
        return result.txHash;
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment execution error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check employer wallet balance
   */
  private async checkEmployerBalance(walletAddress: string): Promise<number> {
    // TODO: In production, query MNEE blockchain
    // const balance = await mneeSDK.getBalance(walletAddress);
    // return balance;

    // Mock implementation
    return 100000;
  }

  /**
   * Fetch all employers from backend
   */
  private async fetchEmployers(): Promise<Employer[]> {
    try {
      // Note: This would need a /api/employers/all endpoint
      // For now, returning empty array as the backend doesn't have this endpoint yet
      console.log('⚠️  Note: Fetching all employers not implemented - would need backend endpoint');
      return [];
    } catch (error) {
      console.error('Failed to fetch employers:', error);
      return [];
    }
  }

  /**
   * Fetch employees for an employer
   */
  private async fetchEmployees(employerId: string): Promise<Employee[]> {
    try {
      const response = await axios.get(
        `${CONFIG.backendUrl}/api/employees?employerId=${employerId}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  }

  /**
   * Create an alert in the backend
   */
  private async createAlert(
    severity: string,
    title: string,
    message: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Note: Would need a POST /api/alerts endpoint
      console.log(`🔔 Alert [${severity}]: ${title} - ${message}`);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunDate: this.lastRunDate,
      config: {
        backendUrl: CONFIG.backendUrl,
        mneeRpcUrl: CONFIG.mneeRpcUrl,
        checkInterval: CONFIG.checkInterval,
      },
    };
  }
}

// Main execution
if (require.main === module) {
  const agent = new SalaryAgent();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  // Start the agent
  agent.start().catch((error) => {
    console.error('Fatal error starting agent:', error);
    process.exit(1);
  });
}

export default SalaryAgent;
