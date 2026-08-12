import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ROOT_FOLDER_ID = "1B_8ZmdccMKnj0eosSr50QNVNWQdkQag7";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const folderId = body.folderId || ROOT_FOLDER_ID;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink)",
      orderBy: "folder,name",
      pageSize: "200",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: authHeader });
    if (!listRes.ok) {
      const text = await listRes.text();
      return Response.json({ error: `구글 드라이브 조회 실패 (${listRes.status}): ${text.slice(0, 300)}` }, { status: 502 });
    }
    const listJson = await listRes.json();

    const metaParams = new URLSearchParams({ fields: "id,name,webViewLink", supportsAllDrives: "true" });
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?${metaParams}`, { headers: authHeader });
    const folder = metaRes.ok ? await metaRes.json() : { id: folderId, name: "공유 폴더" };

    return Response.json({
      rootFolderId: ROOT_FOLDER_ID,
      folder,
      files: listJson.files || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}