# SongForge – AI Music Generator (ISM6427)

A web app where users describe a song (or write their own lyrics) and get AI-generated music back, powered by [SunoAPI.org](https://docs.sunoapi.org/).

## How it works

- `public/` is a static frontend (HTML/CSS/JS, no build step).
- `netlify/functions/` holds serverless functions that call SunoAPI. They keep the API key on the server so it never reaches the browser.
  - `generate`: `POST /api/v1/generate` starts a job and returns a `taskId`
  - `status`: `GET /api/v1/generate/record-info` checks progress. The frontend calls it every 5 seconds until status is `SUCCESS`.
  - `credits`: `GET /api/v1/generate/credit` shows remaining credits
  - `callback`: a no-op endpoint, because the API requires a `callBackUrl`

## Deploy on Netlify

1. In Netlify, choose **Add new site → Import an existing project** and pick this repo, on the `main` branch.
2. Leave the build command empty. `netlify.toml` already sets the publish directory to `public` and the functions directory to `netlify/functions`.
3. Go to **Site configuration → Environment variables** and add:
   - `SUNO_API_KEY` = your key from https://sunoapi.org/api-key
4. Deploy, or redeploy after adding the variable.

> Never commit the API key to this repo.

## Using it

- **Simple mode:** describe the song. Lyrics are written for you.
- **Custom mode:** set your own title, lyrics, vocal gender and length.
- Every request returns two versions. Audio files are kept by SunoAPI for 14 days, so download anything you want to keep.
