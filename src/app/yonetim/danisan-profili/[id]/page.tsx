import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export default async function ClientBoRedirectPage({ params }: { params: PageParams }) {
  const { id } = await params;
  if (!id) notFound();
  redirect(`/yonetim/danisan-profili?clientId=${id}`);
}
