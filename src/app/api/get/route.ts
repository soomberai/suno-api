import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { sunoApi } from '@/lib/SunoApi';
import { corsHeaders } from '@/lib/utils';
import { AudioInfo } from '@/lib/SunoApi';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const songIds = url.searchParams.get('ids');
      const page = url.searchParams.get('page');
      const all = url.searchParams.get('all');  // NEW!
      const cookie = (await cookies()).toString();

      // Get specific songs by IDs
      if (songIds && songIds.length > 0) {
        const idsArray = songIds.split(',');
        const audioInfo = await (await sunoApi(cookie)).get(idsArray, page);
        
        return new NextResponse(JSON.stringify(audioInfo), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Get ALL songs (NEW!)
      if (all === 'true') {
        console.log('Fetching all songs...');
        const allSongs = await fetchAllSongs(cookie);
        
        return new NextResponse(
          JSON.stringify({
            total: allSongs.length,
            songs: allSongs
          }), 
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }

      // Get single page (default behavior)
      const audioInfo = await (await sunoApi(cookie)).get(undefined, page);

      return new NextResponse(JSON.stringify(audioInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error('Error fetching audio:', error);

      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } else {
    return new NextResponse('Method Not Allowed', {
      headers: {
        Allow: 'GET',
        ...corsHeaders
      },
      status: 405
    });
  }
}

// NEW FUNCTION: Gets all songs by looping through pages
async function fetchAllSongs(cookie: string): Promise<AudioInfo[]> {
  const allSongs: AudioInfo[] = [];
  let currentPage = 0;
  let hasMore = true;

  const api = await sunoApi(cookie);

  while (hasMore) {
    console.log(`Fetching page ${currentPage}...`);
    
    try {
      const pageData = await api.get(undefined, currentPage.toString());
      
      if (!pageData || pageData.length === 0) {
        hasMore = false;
        break;
      }

      allSongs.push(...pageData);
      
      if (pageData.length < 20) {
        hasMore = false;
      }

      currentPage++;
      await sleep(100);
    } catch (error) {
      console.error(`Error fetching page ${currentPage}:`, error);
      hasMore = false;
    }
  }

  console.log(`Total songs fetched: ${allSongs.length} across ${currentPage} pages`);
  return allSongs;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
