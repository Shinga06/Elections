import { runAutomatedVerificationTests } from './src/utils/automatedTests.ts';

console.log('====================================================');
console.log('HOUSE COMMITTEE ELECTIONS: AUTOMATED RULE TEST SUITE');
console.log('====================================================\n');

const testSuite = runAutomatedVerificationTests();

testSuite.results.forEach(res => {
  const icon = res.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[Test ${res.id < 10 ? '0' + res.id : res.id}] ${icon} - ${res.name}`);
  console.log(`         Details: ${res.details}`);
});

console.log('\n----------------------------------------------------');
console.log(`TOTAL TESTS: ${testSuite.total} | PASSED: ${testSuite.passed} | FAILED: ${testSuite.failed}`);
console.log('====================================================');

if (testSuite.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
