export function isE2ETestMode() {
  return process.env.E2E_TEST_MODE === "true";
}
