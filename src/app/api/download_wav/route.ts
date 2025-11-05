import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { sunoApi } from '@/lib/SunoApi';
import { corsHeaders } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookie = (await cookies()).toString();
    const body = await req.json();
    
    const { clip_id, wait_audio = true } = body;
    
    if (!clip_id) {
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          error: 'clip_id is required' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Use your existing generateWav method!
    const api = await sunoApi(cookie);
    const result = await api.generateWav(clip_id, wait_audio);

    return new NextResponse(
      JSON.stringify({
        success: result.status === 'complete',
        clip_id: clip_id,
        ...result
      }),
      {
        status: result.status === 'complete' ? 200 : 408,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error downloading WAV:', error);

    return new NextResponse(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
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
