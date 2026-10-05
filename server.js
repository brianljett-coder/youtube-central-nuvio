const express = require("express");

const app = express();

const PORT = process.env.PORT || 7000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const YOUTUBE_SEARCH_URL =
  "https://www.googleapis.com/youtube/v3/search";

const YOUTUBE_VIDEO_URL =
  "https://www.googleapis.com/youtube/v3/videos";

// --------------------------------------------------
// Manifest
// --------------------------------------------------

app.get("/manifest.json", (req, res) => {
  res.json({
    id: "com.youtube.central.nuvio",
    version: "1.1.0",
    name: "YouTube Central",
    description:
      "General YouTube search addon for Nuvio and Stremio.",

    resources: [
      "catalog",
      "meta",
      {
        name: "stream",
        types: ["movie"],
        idPrefixes: ["yt:"]
      }
    ],

    types: [
      "movie"
    ],

    catalogs: [
      {
        type: "movie",
        id: "youtube_search",
        name: "YouTube Central",
        extra: [
          {
            name: "search",
            isRequired: true
          }
        ]
      }
    ],

    idPrefixes: [
      "yt:"
    ],

    behaviorHints: {
      configurable: false
    }
  });
});

// --------------------------------------------------
// YouTube Search
// --------------------------------------------------

app.get(
  "/catalog/:type/:id.json",
  async (req, res) => {
    try {
      const search =
        req.query.search;

      if (!search) {
        return res.json({
          metas: []
        });
      }

      if (!YOUTUBE_API_KEY) {
        console.error(
          "YOUTUBE_API_KEY is missing."
        );

        return res.json({
          metas: []
        });
      }

      const url =
        new URL(YOUTUBE_SEARCH_URL);

      url.searchParams.set(
        "part",
        "snippet"
      );

      url.searchParams.set(
        "q",
        search
      );

      url.searchParams.set(
        "type",
        "video"
      );

      url.searchParams.set(
        "maxResults",
        "25"
      );

      url.searchParams.set(
        "key",
        YOUTUBE_API_KEY
      );

      const response =
        await fetch(
          url.toString()
        );

      if (!response.ok) {
        console.error(
          "YouTube search failed:",
          await response.text()
        );

        return res.json({
          metas: []
        });
      }

      const data =
        await response.json();

      const metas =
        (data.items || [])
          .map((item) => {

            const videoId =
              item.id?.videoId;

            if (!videoId) {
              return null;
            }

            const snippet =
              item.snippet || {};

            const thumbnail =
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url ||
              null;

            return {
              id: `yt:${videoId}`,
              type: "movie",

              name:
                snippet.title ||
                "YouTube Video",

              poster: thumbnail,
              background: thumbnail,

              description:
                snippet.description ||
                "",

              releaseInfo:
                snippet.publishedAt
                  ? snippet.publishedAt.substring(
                      0,
                      10
                    )
                  : "",

              genres: [
                "YouTube"
              ],

              behaviorHints: {
                defaultVideoId:
                  videoId
              }
            };
          })
          .filter(Boolean);

      return res.json({
        metas
      });

    } catch (error) {

      console.error(
        "Catalog error:",
        error
      );

      return res.json({
        metas: []
      });
    }
  }
);
// --------------------------------------------------
// Nuvio/Stremio path-style search support
// --------------------------------------------------

app.get(
  "/catalog/:type/:id/:extra.json",
  async (req, res) => {
    try {
      let search = req.query.search;

      if (!search) {
        const extra = decodeURIComponent(
          req.params.extra || ""
        );

        const match =
          extra.match(/(?:^|&)search=([^&]*)/);

        if (match) {
          search = decodeURIComponent(
            match[1]
          );
        }
      }

      if (!search) {
        return res.json({
          metas: []
        });
      }

      if (!YOUTUBE_API_KEY) {
        console.error(
          "YOUTUBE_API_KEY is missing."
        );

        return res.json({
          metas: []
        });
      }

      const url =
        new URL(YOUTUBE_SEARCH_URL);

      url.searchParams.set(
        "part",
        "snippet"
      );

      url.searchParams.set(
        "q",
        search
      );

      url.searchParams.set(
        "type",
        "video"
      );

      url.searchParams.set(
        "maxResults",
        "25"
      );

      url.searchParams.set(
        "key",
        YOUTUBE_API_KEY
      );

      const response =
        await fetch(
          url.toString()
        );

      if (!response.ok) {
        console.error(
          "YouTube path search failed:",
          await response.text()
        );

        return res.json({
          metas: []
        });
      }

      const data =
        await response.json();

      const metas =
        (data.items || [])
          .map((item) => {

            const videoId =
              item.id?.videoId;

            if (!videoId) {
              return null;
            }

            const snippet =
              item.snippet || {};

            const thumbnail =
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url ||
              null;

            return {
              id: `yt:${videoId}`,
              type: "movie",

              name:
                snippet.title ||
                "YouTube Video",

              poster: thumbnail,
              background: thumbnail,

              description:
                snippet.description ||
                "",

              releaseInfo:
                snippet.publishedAt
                  ? snippet.publishedAt.substring(
                      0,
                      10
                    )
                  : "",

              genres: [
                "YouTube"
              ],

              behaviorHints: {
                defaultVideoId:
                  videoId
              }
            };
          })
          .filter(Boolean);

      return res.json({
        metas
      });

    } catch (error) {

      console.error(
        "Path search error:",
        error
      );

      return res.json({
        metas: []
      });
    }
  }
);
// --------------------------------------------------
// Metadata
// --------------------------------------------------

app.get(
  "/meta/:type/:id.json",
  async (req, res) => {

    try {

      let videoId =
        req.params.id;

      if (
        videoId.startsWith("yt:")
      ) {
        videoId =
          videoId.substring(3);
      }

      if (!YOUTUBE_API_KEY) {
        return res.json({
          meta: null
        });
      }

      const url =
        new URL(YOUTUBE_VIDEO_URL);

      url.searchParams.set(
        "part",
        "snippet,contentDetails"
      );

      url.searchParams.set(
        "id",
        videoId
      );

      url.searchParams.set(
        "key",
        YOUTUBE_API_KEY
      );

      const response =
        await fetch(
          url.toString()
        );

      if (!response.ok) {
        return res.json({
          meta: null
        });
      }

      const data =
        await response.json();

      const video =
        data.items?.[0];

      if (!video) {
        return res.json({
          meta: null
        });
      }

      const snippet =
        video.snippet || {};

      const thumbnail =
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        null;

      return res.json({
        meta: {
          id: `yt:${videoId}`,

          type: "movie",

          name:
            snippet.title ||
            "YouTube Video",

          poster: thumbnail,
          background: thumbnail,

          description:
            snippet.description ||
            "",

          releaseInfo:
            snippet.publishedAt
              ? snippet.publishedAt.substring(
                  0,
                  10
                )
              : "",

          genres: [
            "YouTube"
          ],

          director: [
            snippet.channelTitle ||
            "YouTube"
          ]
        }
      });

    } catch (error) {

      console.error(
        "Metadata error:",
        error
      );

      return res.json({
        meta: null
      });
    }
  }
);

// --------------------------------------------------
// YouTube Stream
// --------------------------------------------------

app.get(
  "/stream/:type/:id.json",
  async (req, res) => {

    try {

      let videoId =
        req.params.id;

      if (
        videoId.startsWith("yt:")
      ) {
        videoId =
          videoId.substring(3);
      }

      if (!videoId) {
        return res.json({
          streams: []
        });
      }

      return res.json({
        streams: [
          {
            name: "YouTube",
            title: "Watch on YouTube",
            externalUrl:
              `https://www.youtube.com/watch?v=${videoId}`
          }
        ]
      });

    } catch (error) {

      console.error(
        "Stream error:",
        error
      );

      return res.json({
        streams: []
      });
    }
  }
);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/", (req, res) => {
  res.send(
    "YouTube Central is running."
  );
});

// --------------------------------------------------
// Start
// --------------------------------------------------

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `YouTube Central listening on port ${PORT}`
    );
  }
);
