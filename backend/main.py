import os
import random
import string
import base64
import uvicorn
import requests
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# FastAPI app instance
app = FastAPI()

# Global access token variable
access_token = ''

# Load Spotify credentials from environment variables
spotify_client_id = os.getenv('SPOTIFY_CLIENT_ID')
spotify_client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

# Spotify redirect URI
spotify_redirect_uri = 'http://localhost:3000/auth/callback'


def generate_random_string(length: int) -> str:
    """Generates a random string for the state parameter"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


@app.get('/auth/login')
async def login():
    """Redirects the user to Spotify's authorization page"""
    scope = "streaming user-read-email user-read-private"
    state = generate_random_string(16)

    auth_query_parameters = {
        'response_type': 'code',
        'client_id': spotify_client_id,
        'scope': scope,
        'redirect_uri': spotify_redirect_uri,
        'state': state
    }

    # Redirect to the Spotify login page
    auth_url = 'https://accounts.spotify.com/authorize/?' + '&'.join(f"{key}={value}" for key, value in auth_query_parameters.items())
    return RedirectResponse(url=auth_url)


@app.get('/auth/callback')
async def callback(request: Request):
    """Handles the callback from Spotify and exchanges the authorization code for an access token"""
    code = request.query_params.get('code')

    auth_data = {
        'code': code,
        'redirect_uri': spotify_redirect_uri,
        'grant_type': 'authorization_code'
    }

    headers = {
        'Authorization': 'Basic ' + base64.b64encode(f'{spotify_client_id}:{spotify_client_secret}'.encode()).decode('utf-8'),
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    async with httpx.AsyncClient() as client:
        response = await client.post('https://accounts.spotify.com/api/token', data=auth_data, headers=headers)
    
    if response.status_code == 200:
        global access_token
        access_token = response.json().get('access_token')
        return RedirectResponse(url='/')
    
    return JSONResponse(content={"error": "Unable to authenticate"}, status_code=400)


@app.get('/auth/token')
async def token():
    """Returns the access token"""
    return JSONResponse(content={'access_token': access_token})

@app.get('/auth/play_by_url')
async def play_by_url(url: str = ''):
    """Extracts the track URI from the provided URL and plays the song"""
    track_id = url.split('/')[-1].split('?')[0]
    track_url = f'https://api.spotify.com/v1/tracks/{track_id}'
    
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    # Get track details from Spotify API
    response = requests.get(track_url, headers=headers)
    
    if response.status_code != 200:
        return JSONResponse(content={"error": "Failed to fetch track info", "details": response.json()}, status_code=response.status_code)
    
    track = response.json()
    track_uri = track.get('uri')

    if not track_uri:
        return JSONResponse(content={"error": "Track URI not found"}, status_code=400)
    
    # Here you can use the URI to play the track via Spotify Web API (client-side)
    return JSONResponse(content={"track_uri": track_uri})

if __name__ == '__main__':
    uvicorn.run(app, host="localhost", port=5000)
