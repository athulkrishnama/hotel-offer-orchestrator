import { Connection, Client } from "@temporalio/client";
async function run() {
  console.log("Connecting...");
  const connection = await Connection.connect({ address: "localhost:7233" });
  console.log("Connected!");
  process.exit(0);
}
run().catch(console.error);
