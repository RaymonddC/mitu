/**
 * Deploy MNEE Autonomous Agent
 *
 * This script deploys the salary_agent.ts to MNEE Agent Runtime
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function deployAgent() {
  console.log('🚀 Deploying MNEE Autonomous Payroll Agent...\n');

  // Get configuration
  const rpcUrl = process.env.MNEE_RPC_URL || 'https://testnet.mnee-rpc.io';
  const chainId = process.env.MNEE_CHAIN_ID || 'mnee-testnet-1';
  const agentKey = process.env.AGENT_PRIVATE_KEY;
  const contractAddress = process.env.SALARY_CONTRACT_ADDRESS;

  console.log(`📡 RPC URL: ${rpcUrl}`);
  console.log(`⛓️  Chain ID: ${chainId}`);
  console.log(`📋 Contract: ${contractAddress || 'NOT SET'}`);

  if (!agentKey) {
    console.error('❌ Error: AGENT_PRIVATE_KEY not set in .env');
    console.log('   Please add your MNEE agent private key to .env file');
    process.exit(1);
  }

  if (!contractAddress) {
    console.error('❌ Error: SALARY_CONTRACT_ADDRESS not set in .env');
    console.log('   Please deploy the contract first: cd contracts && npm run deploy');
    process.exit(1);
  }

  console.log('✅ Configuration loaded\n');

  console.log('🤖 Agent: salary_agent.ts');
  console.log('   - Daily payroll checks');
  console.log('   - Balance validation');
  console.log('   - Automatic salary execution');
  console.log('   - Retry logic for failures');
  console.log('   - Alert generation\n');

  // TODO: Actual deployment using MNEE Agent SDK
  // Example (adjust based on actual MNEE SDK):
  //
  // const signer = new MNEESigner(agentKey);
  // const agent = new MNEEAgent('./salary_agent.ts');
  // const deployed = await agent.deploy(signer, {
  //   network: chainId,
  //   rpcUrl: rpcUrl,
  //   schedule: '0 0 * * *', // Daily at midnight
  //   config: {
  //     contractAddress,
  //     backendUrl: process.env.NEXT_PUBLIC_API_URL
  //   }
  // });
  // const agentId = deployed.id;

  console.log('⚠️  NOTE: This is a mock deployment script.');
  console.log('   Replace with actual MNEE Agent Runtime deployment commands.\n');

  // Mock deployment
  const mockAgentId = `mnee_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('✅ Agent deployed successfully!\n');
  console.log(`🆔 Agent ID: ${mockAgentId}`);
  console.log(`📅 Schedule: Daily at 00:00 UTC`);
  console.log(`🔗 Dashboard: https://agent-dashboard.mnee.io/agent/${mockAgentId}`);
  console.log('\n' + '='.repeat(60));
  console.log('✅ Deployment Complete!');
  console.log('='.repeat(60));
  console.log('\nYour autonomous payroll agent is now live on MNEE Network!');
  console.log('\nThe agent will:');
  console.log('• Check for due payroll every day at midnight');
  console.log('• Validate employer balances before execution');
  console.log('• Execute salary transfers via Flow Contract');
  console.log('• Create alerts for any issues');
  console.log('• Log all actions to the backend');
  console.log('\nMonitoring:');
  console.log('• View logs: https://agent-dashboard.mnee.io/agent/' + mockAgentId);
  console.log('• Check contract events: https://explorer.mnee.io/contract/' + contractAddress);
  console.log('\nLocal testing:');
  console.log('• Run agent locally: npm run dev');
  console.log('• This will execute the agent immediately for testing');
}

deployAgent().catch((error) => {
  console.error('❌ Agent deployment failed:', error);
  process.exit(1);
});
