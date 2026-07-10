import { blockAdmins } from "@/lib/auth/admin";
import CompilerStandalone from "./CompilerStandalone";

export const dynamic = "force-dynamic";

export default async function CompilerPage() {
  await blockAdmins();
  return <CompilerStandalone />;
}
