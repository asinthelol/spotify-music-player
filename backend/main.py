import os
import random
import string
import base64
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global access token variable
access_token = ''

# Load Spotify credentials from environment variables
spotify_client_id = os.getenv('SPOTIFY_CLIENT_ID')
spotify_client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

# Spotify redirect URI
spotify_redirect_uri = 'http://localhost:3000/auth/callback'

# Exactly what you think it does
def generate_random_string(length: int) -> str:
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

# Grabs the authorization code from the Spotify API
@app.get('/auth/login')
async def login():
    scope = "streaming user-read-email user-read-private"
    state = generate_random_string(16)

    auth_query_parameters = {
        'response_type': 'code',
        'client_id': spotify_client_id,
        'scope': scope,
        'redirect_uri': spotify_redirect_uri,
        'state': state
    }

    # Redirect to the Spotify login/auth page
    auth_url = 'https://accounts.spotify.com/authorize/?' + '&'.join(f"{key}={value}" for key, value in auth_query_parameters.items())
    return RedirectResponse(url=auth_url)

# Exchanges the authorization code for an access token
@app.get('/auth/callback')
async def callback(request: Request):
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

# Get the access token
@app.get('/auth/token')
async def token():
    return JSONResponse(content={'access_token': access_token})

if __name__ == '__main__':
    uvicorn.run(app, host="localhost", port=5000)
