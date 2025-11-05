import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { sunoApi } from '@/lib/SunoApi';
import { corsHeaders } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * POST /api/download_wav
 * 
 * Downloads WAV file for a specific clip.
 * 
 * Request body:
 * {
 *   "clip_id": "string",      // Required: The ID of the clip to download as WAV
 *   "wait_audio": boolean     // Optional: Whether to wait for WAV to be ready (default: true)
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "clip_id": "string",
 *   "status": "complete" | "timeout" | "error",
 *   "wav_url": "string"       // URL to download the WAV file
 * }
 */
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

    // Use the existing generateWav method from SunoApi
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

/**
 * POST /api/download_wav/batch
 * 
 * Batch download multiple WAV files.
 * 
 * Request body:
 * {
 *   "clip_ids": ["string"],           // Required: Array of clip IDs
 *   "wait_audio": boolean,            // Optional: Whether to wait for each WAV (default: true)
 *   "delay_between_requests": number  // Optional: Delay in seconds between requests (default: 2)
 * }
 */
export async function PATCH(req: NextRequest) {
  try {
    const cookie = (await cookies()).toString();
    const body = await req.json();
    
    const { clip_ids, wait_audio = true, delay_between_requests = 2 } = body;
    
    if (!clip_ids || !Array.isArray(clip_ids) || clip_ids.length === 0) {
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          error: 'clip_ids array is required' 
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

    // Use the existing batchGenerateWav method from SunoApi
    const api = await sunoApi(cookie);
    const results = await api.batchGenerateWav(clip_ids, wait_audio, delay_between_requests);

    return new NextResponse(
      JSON.stringify({
        success: true,
        total: results.length,
        results: results
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error batch downloading WAVs:', error);

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
