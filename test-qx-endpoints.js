#!/usr/bin/env node

/**
 * Test script to find real QX transactions using various API endpoints
 */

const axios = require('axios');

const QX_CONTRACT = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID';

async function testEndpoint(name, url) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  try {
    const response = await axios.get(url, { timeout: 10000 });
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Data keys:`, Object.keys(response.data).join(', '));
    
    if (Array.isArray(response.data)) {
      console.log(`   📦 Array length: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log(`   🎯 Sample item keys:`, Object.keys(response.data[0]).join(', '));
      }
    } else if (response.data.transactions) {
      console.log(`   📦 Transactions: ${response.data.transactions.length}`);
    } else if (response.data.transfers) {
      console.log(`   📦 Transfers: ${response.data.transfers.length}`);
    }
    
    return response.data;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   📝 Status: ${error.response.status}`);
    }
    return null;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║      QX DATA FINDER - API ENDPOINT TESTER        ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const endpoints = [
    // Archive API (from documentation)
    {
      name: 'Archive - Identity Transfers',
      url: `https://archive.qubic.org/v1/identities/${QX_CONTRACT}/transfers?startTick=38000000&endTick=38850000`
    },
    {
      name: 'Archive - Latest Transfers',
      url: `https://archive.qubic.org/v1/identities/${QX_CONTRACT}/latest-transfers?pageSize=10`
    },
    // RPC v2 - Query by identity
    {
      name: 'RPC v2 - Entity Transactions',
      url: `https://rpc.qubic.org/v2/entities/${QX_CONTRACT}/transactions?startTick=38000000&endTick=38850000`
    },
    // Try tick range with transactions
    {
      name: 'RPC v2 - Tick 30000000',
      url: 'https://rpc.qubic.org/v2/ticks/30000000/transactions'
    },
    {
      name: 'RPC v2 - Tick 21180000',
      url: 'https://rpc.qubic.org/v2/ticks/21180000/transactions'
    },
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.url);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
  }

  console.log('\n✅ Test complete!');
}

main().catch(console.error);
