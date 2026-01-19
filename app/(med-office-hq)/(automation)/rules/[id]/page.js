// app/(med-office-hq)/(automation)/rules/[id]/page.tsx or .js

import CodePage from "@/components/med-office-hq/automation/rules/code";

export default async function Page({ params }) {
  const id = await params?.id;

  return <CodePage id={id} />;
}
