const { PublicKey } = require('@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey');

const testHex = '72a2d080fa8a6478239616a50837ec129c45324affabd3bb1f12a0901e3a49ee';
const testBytes = Buffer.from(testHex, 'hex');

console.log('Test bytes:', testBytes);

try {
  const publicKey = new PublicKey(testBytes);
  console.log('\nPublicKey object:', publicKey);
  console.log('\nMethods:', Object.getOwnPropertyNames(Object.getPrototypeOf(publicKey)));
  
  // Try the method with typo
  const identityString = publicKey.getIdentityAsSring();
  console.log('\nIdentity string:', identityString);
  console.log('Length:', identityString.length);
  
} catch (error) {
  console.error('Error:', error);
}
