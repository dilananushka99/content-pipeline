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
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // Send direct HTTP delete request using native fetch
    const deleteRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteRes.ok && deleteRes.status !== 404) { // Don't crash if already deleted
      const deleteErr = await deleteRes.text();
      throw new Error(`Google Drive API Delete failed: ${deleteErr}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Drive Delete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
