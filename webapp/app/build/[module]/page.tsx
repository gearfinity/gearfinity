import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConfiguratorShell from "@/components/ConfiguratorShell";
import { config, MODULE_IDS } from "@/lib/config";

export function generateStaticParams() {
  return MODULE_IDS.map((id) => ({ module: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: id } = await params;
  const mod = config.modules[id];
  return { title: mod ? mod.name : "Module" };
}

export default async function BuildPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: id } = await params;
  if (!config.modules[id]) notFound();
  return <ConfiguratorShell moduleId={id} />;
}
