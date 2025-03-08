# Spotify Music Player

## Before Initializing

You will need to register your app (Web Playback SDK) and get your own credentials from
[Spotify for Developers Dashboard](https://developer.spotify.com/dashboard/)


Create your application and register the following Redirect URI in settings:

`http://localhost:3000/auth/callback`

Next, create a file called `.env` in the root folder of the repository and fill in
the quotations with your Spotify app credentials.

```bash
SPOTIFY_CLIENT_ID='clientId'
SPOTIFY_CLIENT_SECRET='clientSecret'
```

## Quick Start

1. Clone the repo

```bash
git clone https://github.com/asinthelol/spotify-music-player.git
cd spotify-music-player/frontend
```

2. Install the dependencies

```bash
npm install
npm run install:backend
```

3. Run the app

```bash
npm run start
```
Navigate to http://localhost:3000/

## Features

- Play/Pause
- Next/Previous Track

## Built With

- React
- TypeScript
- Sass
- Vite
- Python

## License

I don't care what you do with it, just don't say you made this version.
