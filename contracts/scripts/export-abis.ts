/**
 * Export contract ABIs to a shared location for backend consumption
 * This makes it easy for the backend app to import contract ABIs
 */

import * as fs from "fs";
import * as path from "path";

async function main() {
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const abiExportDir = path.join(__dirname, "../../apps/backend/src/contracts/abis");

  // Create export directory if it doesn't exist
  if (!fs.existsSync(abiExportDir)) {
    fs.mkdirSync(abiExportDir, { recursive: true });
  }

  // Get all contract artifact files
  const contracts = fs
    .readdirSync(artifactsDir)
    .filter((file) => file.endsWith(".sol"))
    .map((file) => file.replace(".sol", ""));

  console.log("\n=== Exporting Contract ABIs ===\n");

  for (const contract of contracts) {
    const artifactPath = path.join(artifactsDir, contract, `${contract}.json`);

    if (!fs.existsSync(artifactPath)) {
      console.warn(`Artifact not found: ${artifactPath}`);
      continue;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const abi = artifact.abi;

    // Export ABI
    const abiExportPath = path.join(abiExportDir, `${contract}.json`);
    fs.writeFileSync(abiExportPath, JSON.stringify(abi, null, 2));

    // Export TypeScript types
    const tsExportPath = path.join(abiExportDir, `${contract}.ts`);
    const tsContent = `// Auto-generated file - do not edit manually
export const ${contract}ABI = ${JSON.stringify(abi, null, 2)} as const;

export type ${contract}ABI = typeof ${contract}ABI;
`;
    fs.writeFileSync(tsExportPath, tsContent);

    console.log(`Exported ${contract}`);
  }

  console.log("\nABI export completed!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
