export const maxDuration = 300; // Allow up to 5 minutes for uploading large video files

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
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.replace(/^"|"$/g, '');

    if (!folderId) {
      return NextResponse.json({ error: 'Google Drive folder ID is missing' }, { status: 500 });
    }

    // Construct the metadata part
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    const boundary = 'drive_upload_boundary_xxxx';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart =
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Construct the multipart body using Buffer concatenation
    const bodyHeader = delimiter + metadataPart + delimiter + `Content-Type: ${file.type || 'video/mp4'}\r\n\r\n`;
    const bodyFooter = closeDelimiter;

    const headerBuffer = Buffer.from(bodyHeader, 'utf-8');
    const footerBuffer = Buffer.from(bodyFooter, 'utf-8');

    const multipartBody = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);

    // Send native fetch POST request to Google Drive Upload API
    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartBody.length.toString(),
        },
        body: multipartBody,
      }
    );

    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      throw new Error(`Google Drive API Upload failed: ${uploadErr}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;
    const webViewLink = uploadData.webViewLink;
    const webContentLink = uploadData.webContentLink;

    // Set file permissions to 'anyone with the link can view' using native fetch
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
    }

    return NextResponse.json({
      success: true,
      id: fileId,
      fileId: fileId,
      webViewLink,
      webContentLink,
    });
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
