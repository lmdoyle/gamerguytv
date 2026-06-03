const API_KEY = 'AIzaSyBO_340lPaIBW2J5EBubFsTuUPmzbYFLhg';
const CHANNEL_ID = 'UCqerFn8i1CGwejETEnnGEfw';
const UPLOADS_PLAYLIST = 'UUqerFn8i1CGwejETEnnGEfw'; // UC -> UU

function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

async function loadVideos() {
  // Step 1: Get the 20 most recent uploads
  const playlistResp = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${UPLOADS_PLAYLIST}&maxResults=20&key=${API_KEY}`
  );
  const playlistData = await playlistResp.json();
  if (playlistData.error) throw new Error('API error: ' + playlistData.error.message);
  if (!playlistData.items?.length) throw new Error('No items in playlist');

  const items = playlistData.items;
  const videoIds = items.map(i => i.snippet.resourceId.videoId).join(',');

  // Step 2: Get durations in one batch call to filter out Shorts (<=60s)
  const detailsResp = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
  );
  const detailsData = await detailsResp.json();
  if (detailsData.error) throw new Error('Details API error: ' + detailsData.error.message);
  const durations = {};
  detailsData.items.forEach(v => { durations[v.id] = parseDuration(v.contentDetails.duration); });

  // Step 3: Filter out Shorts and take first 6
  const videos = items
    .filter(i => (durations[i.snippet.resourceId.videoId] || 0) > 60)
    .slice(0, 6);

  document.getElementById('yt-loading').style.display = 'none';
  const grid = document.getElementById('yt-grid');
  videos.forEach(item => {
    const snippet = item.snippet;
    const videoId = snippet.resourceId.videoId;
    const title = snippet.title;
    const link = `https://www.youtube.com/watch?v=${videoId}`;
    const thumb = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url;
    const date = new Date(snippet.publishedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
    grid.innerHTML += `
      <div class="col">
        <a class="video-card" href="${link}" target="_blank">
          <img src="${thumb}" alt="${title}">
          <div class="video-card-body">
            <div class="video-card-title">${title}</div>
            <div class="video-card-date">${date}</div>
          </div>
        </a>
      </div>`;
  });
}

loadVideos().catch(() => {
  document.getElementById('yt-loading').style.display = 'none';
  document.getElementById('yt-error').style.display = 'block';
});
