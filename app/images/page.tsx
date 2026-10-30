import Image from "next/image";
import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { indexBy, loadDataset, profileName } from "@/lib/admin/data";
import { listImages } from "@/lib/admin/images";
import { ImageRowTools, UploadImage } from "@/components/ImageTools";

const MAIN_APP = "https://hello-world-nextjs-blue.vercel.app";

export default async function ImagesPage() {
  const admin = await requireSuperadmin();
  const [images, data] = await Promise.all([listImages(), loadDataset()]);
  const profiles = indexBy(data.profiles);
  const momentByUrl = new Map(data.generations.map((g) => [g.image_url, g.id]));

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Images ({images.length})</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Every photo in the moments bucket. Upload one here, then open &quot;Generate captions&quot; to run the pipeline on it as yourself.
        </p>
      </div>
      <section className="rounded border border-black p-3">
        <h2 className="mb-2 text-lg font-semibold">Upload</h2>
        <UploadImage adminId={admin.id} />
      </section>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="th">Photo</th>
            <th className="th">Owner</th>
            <th className="th">Size</th>
            <th className="th">Updated</th>
            <th className="th">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black">
          {images.map((img) => (
            <tr key={img.path}>
              <td className="py-2 pr-4">
                <a href={img.publicUrl} target="_blank" rel="noreferrer">
                  <Image src={img.publicUrl} alt="" width={64} height={64} className="h-16 w-16 rounded object-cover" />
                </a>
              </td>
              <td className="py-2 pr-4"><Link href={`/users/${img.ownerId}`} className="underline">{profileName(profiles.get(img.ownerId))}</Link></td>
              <td className="py-2 pr-4">{img.sizeBytes !== null ? `${Math.round(img.sizeBytes / 1024)} KB` : "–"}</td>
              <td className="py-2 pr-4">{img.updatedAt ? img.updatedAt.slice(0, 10) : "–"}</td>
              <td className="py-2 pr-4">
                <ImageRowTools
                  path={img.path}
                  isMine={img.ownerId === admin.id}
                  usedByMomentId={momentByUrl.get(img.publicUrl) ?? null}
                  generateUrl={`${MAIN_APP}/generate?image=${encodeURIComponent(img.path)}`}
                />
              </td>
            </tr>
          ))}
          {images.length === 0 && <tr><td colSpan={5} className="py-3 text-neutral-600">No photos yet.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
