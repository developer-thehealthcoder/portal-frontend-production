import RunDetail from "@/components/med-office-hq/automation/run/run-detail";

export default async function Page({ params }) {
  const { id } = await params;
  return <RunDetail id={id} />;
}
