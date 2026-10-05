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
    version: "1.0.0",
    name: "YouTube Central",
    description:
      "General-purpose YouTube search addon for Nuvio/Stremio.",

    resources: [
      "catalog",
      "meta"
    ],

    types: [
      "movie",
      "series"
    ],

    catalogs: [
      {
        type: "movie",
        id: "youtube_search",
        name: "▶️ YouTube",
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
    ]
  });
});

// --------------------------------------------------
// YouTube Search
// --------------------------------------------------

app.get(
  "/catalog/:type/:id.json",
  async (req, res) => {
    try {
      const search = req.query.search;

      if (!search) {
        return res.json({
          metas: []
        });
      }

      if (!YOUTUBE_API_KEY) {
        console.error(
          "YOUTUBE_API_KEY is not configured."
        );

        return res.status(500).json({
          metas: []
        });
      }

      const url = new URL(YOUTUBE_SEARCH_URL);

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
        "safeSearch",
        "none"
      );

      url.searchParams.set(
        "key",
        YOUTUBE_API_KEY
      );

      const response = await fetch(
        url.toString()
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "YouTube API error:",
          errorText
        );

        return res.json({
          metas: []
        });
      }

      const data =
        await response.json();

      const metas =
        (data.items || []).map(
          (item) => {
            const videoId =
              item.id &&
              item.id.videoId;

            if (!videoId) {
              return null;
            }

            const snippet =
              item.snippet || {};

            const title =
              snippet.title ||
              "YouTube Video";

            const description =
              snippet.description ||
              "";

            const thumbnail =
              snippet.thumbnails?.high?.url ||
              snippet.thumbnails?.medium?.url ||
              snippet.thumbnails?.default?.url ||
              null;

            return {
              id: `yt:${videoId}`,

              type: "movie",

              name: title,

              poster: thumbnail,

              background: thumbnail,

              description,

              releaseInfo:
                snippet.publishedAt
                  ? snippet.publishedAt.substring(
                      0,
                      10
                    )
                  : undefined,

              runtime: "YouTube",

              genres: [
                "YouTube"
              ]
            };
          }
        ).filter(Boolean);

      res.json({
        metas
      });

    } catch (error) {

      console.error(
        "Search error:",
        error
      );

      res.json({
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

      const rawId =
        req.params.id;

      const videoId =
        rawId.startsWith("yt:")
          ? rawId.substring(3)
          : rawId;

      if (!YOUTUBE_API_KEY) {
        return res.json({
          meta: null
        });
      }

      const url =
        new URL(YOUTUBE_VIDEO_URL);

      url.searchParams.set(
        "part",
        "snippet
