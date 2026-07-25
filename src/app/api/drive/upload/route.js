export const maxDuration = 300; // Allow up to 5 minutes

import { NextResponse } from 'next/server';

async function getAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.replace(/^"|"$/g, '');
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.replace(/^"|"$/g, '');
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.replace(/^"|"$/g, '');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive credentials are not fully configured in environment variables');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    // Sub-action: set file public viewer permissions
    if (action === 'permission') {
      const { fileId } = body;
      if (!fileId) {
        return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
      }

      const accessToken = await getAccessToken();
      const permissionRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'reader',
            type: 'anyone',
          }),
        }
      );

      if (!permissionRes.ok) {
        const permissionErr = await permissionRes.text();
        console.warn('Failed to set public viewing permissions:', permissionErr);
        return NextResponse.json({ error: permissionErr }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Default action: Create resumable upload session
    const { fileName, fileType, fileSize } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'Missing fileName parameter' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.replace(/^"|"$/g, '');

    if (!folderId) {
      return NextResponse.json({ error: 'Google Drive folder ID is missing' }, { status: 500 });
    }

    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    // Extract client origin dynamically from request headers
    const clientOrigin = req.headers.get('origin') || req.headers.get('referer') || '*';

    const sessionRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': fileType || 'video/mp4',
          'X-Upload-Content-Length': fileSize ? fileSize.toString() : '0',
          Origin: clientOrigin,
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!sessionRes.ok) {
      const sessionErr = await sessionRes.text();
      throw new Error(`Google Drive API resumable initialization failed: ${sessionErr}`);
    }

    const uploadUrl = sessionRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Google Drive did not return a resumable Location upload URL');
    }

    return NextResponse.json({
      success: true,
      uploadUrl,
    });
  } catch (error) {
    console.error('Google Drive Resumable API Session Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
