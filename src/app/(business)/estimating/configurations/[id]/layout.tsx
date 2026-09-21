import { SpecialistWorkspace } from "../../../../../components/specialist-workbench";
export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  return (
    <>
      <SpecialistWorkspace id={id} />
      {children}
    </>
  );
}
