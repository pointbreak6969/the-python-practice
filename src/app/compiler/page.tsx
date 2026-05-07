"use client";

import dynamic from "next/dynamic";

const Compiler = dynamic(() => import("@/components/Compiler"), { ssr: false });

export default function CompilerPage() {
  return <Compiler />;
}
