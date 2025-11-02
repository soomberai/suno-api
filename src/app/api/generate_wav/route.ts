import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { sunoApi } from '@/lib/SunoApi';
import { corsHeaders } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids, wait_audio = true, delay_between_requests = 2 } = body;
    const cookie = (await cookies()).toString();

    const api = await sunoApi(cookie);

    // Single song WAV generation
    if (id) {
      const result = await api.generateWav(id, wait_audio);
      return new NextResponse(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Batch WAV generation
    if (ids && Array.isArray(ids)) {
      const results = await api.batchGenerateWav(ids, wait_audio, delay_between_requests);
      return new NextResponse(JSON.stringify(results), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    return new NextResponse(
      JSON.stringify({ error: 'Please provide either "id" for single conversion or "ids" array for batch conversion' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error: any) {
    console.error('Error generating WAV:', error);

    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}