import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetPath = path.join('/');
  const targetUrl = `${BACKEND_URL}/${targetPath}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const body = await request.text();
    if (body) {
      fetchOptions.body = body;
    }
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Propagate important headers including x402 payment headers
    const x402Headers = [
      'x-payment-required',
      'x-payment-address',
      'x-payment-amount',
      'x-payment-token',
      'x-payment-network',
      'x-payment-recipient',
    ];

    x402Headers.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });

    const contentType = response.headers.get('content-type');
    let responseBody: BodyInit | null = null;

    if (contentType?.includes('application/json')) {
      responseBody = await response.text();
    } else {
      responseBody = await response.arrayBuffer();
    }

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}
