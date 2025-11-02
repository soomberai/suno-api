import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { sunoApi } from '@/lib/SunoApi';
import { corsHeaders } from '@/lib/utils';
import { AudioInfo } from '@/lib/SunoApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/get
 * 
 * Query parameters:
 * - ids: Comma-separated song IDs (optional)
 * - page: Page number for pagination (optional)
 * - all: If "true", fetches ALL songs across all pages (optional)
 * 
 * Examples:
 * - /api/get?ids=song1,song2        Get specific songs
 * - /api/get?page=0                 Get first page (20 songs)
 * - /api/get?all=true               Get ALL songs (240+)
 */
export async function GET(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const songIds = url.searchParams.get('ids');
      const page = url.searchParams.get('page');
      const all = url.searchParams.get('all');
      const cookie = (await cookies()).toString();

      // If specific IDs are requested, fetch those songs
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

      // If all=true, fetch ALL songs across all pages
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

      // Otherwise, fetch a specific page (or first page if no page specified)
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

/**
 * Fetches all songs by paginating through all available pages.
 * @param cookie The authentication cookie
 * @returns Promise resolving to array of all songs
 */
async function fetchAllSongs(cookie: string): Promise<AudioInfo[]> {
  const allSongs: AudioInfo[] = [];
  let currentPage = 0;
  let hasMore = true;

  const api = await sunoApi(cookie);

  while (hasMore) {
    console.log(`Fetching page ${currentPage}...`);
    
    try {
      const pageData = await api.get(undefined, currentPage.toString());
      
      // If we get no songs or empty array, we've reached the end
      if (!pageData || pageData.length === 0) {
        hasMore = false;
        break;
      }

      allSongs.push(...pageData);
      
      // If we got less than 20 songs, this is likely the last page
      if (pageData.length < 20) {
        hasMore = false;
      }

      currentPage++;
      
      // Small delay to avoid overwhelming the API
      await sleep(100);
    } catch (error) {
      console.error(`Error fetching page ${currentPage}:`, error);
      // Stop pagination on error
      hasMore = false;
    }
  }

  console.log(`Total songs fetched: ${allSongs.length} across ${currentPage} pages`);
  return allSongs;
}

/**
 * Helper function to sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
