import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export default async function AdminClientDetailRedirect({ params }: { params: PageParams }) {
  const { id } = await params;
  if (id === "yeni") redirect("/yonetim/danisan-olustur");
  redirect(`/yonetim/danisan-profili?clientId=${encodeURIComponent(id)}`);
}
