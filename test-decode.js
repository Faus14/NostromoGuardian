const axios = require('axios');

async function test() {
  const response = await axios.post(
    'https://rpc.qubic.org/query/v1/getTransactionsForIdentity',
    {
      identity: 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARMID',
      pagination: { offset: 0, size: 1 }
    }
  );

  const tx = response.data.transactions[0];
  console.log('Transaction:', JSON.stringify(tx, null, 2));
  
  const inputBuffer = Buffer.from(tx.inputData, 'base64');
  console.log('\nInput buffer length:', inputBuffer.length);
  console.log('Input buffer hex:', inputBuffer.toString('hex'));
  
  // Parse issuer (first 32 bytes)
  const issuerBytes = inputBuffer.subarray(0, 32);
  console.log('\nIssuer bytes:', issuerBytes);
  console.log('Issuer hex:', issuerBytes.toString('hex'));
  
  // Parse asset name (bytes 32-40)
  const assetNameBytes = inputBuffer.subarray(32, 40);
  console.log('\nAsset name bytes:', assetNameBytes);
  console.log('Asset name hex:', assetNameBytes.toString('hex'));
  console.log('Asset name ASCII:', assetNameBytes.toString('ascii'));
  
  // Parse price (bytes 40-48)
  const price = inputBuffer.readBigInt64LE(40);
  console.log('\nPrice:', price.toString());
  
  // Parse shares (bytes 48-56)
  const shares = inputBuffer.readBigInt64LE(48);
  console.log('Shares:', shares.toString());
}

test().catch(console.error);
