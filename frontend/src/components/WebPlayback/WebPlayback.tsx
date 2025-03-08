import { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./webplayback.module.scss";

declare global {
  interface Window {
      onSpotifyWebPlaybackSDKReady: () => void;
      Spotify: any;
  }

  namespace Spotify {
    interface PlaybackState {
      paused: boolean;
      track_window: {
        current_track: Track;
      };
    }
    interface Player {
      connect(): Promise<boolean>;
      disconnect(): void;
      getCurrentState(): Promise<PlaybackState | null>;
      addListener(event: string, callback: (data: any) => void): void;
      removeListener(event: string, callback?: (data: any) => void): void;
      previousTrack(): void;
      togglePlay(): void;
      nextTrack(): void;
    }
  }
}

interface Track {
    name: string;
    album: {
        images: { url: string }[];
    };
    artists: { name: string }[];
    preview_url: string;
}

interface Song {
    id: string;
    name: string;
    album: {
        images: { url: string }[];
    };
    artists: { name: string }[];
    uri: string;
}

interface WebPlaybackProps {
    token: string;
}

const track: Track = {
  name: "",
  album: {
      images: [
          { url: "" }
      ]
  },
  artists: [
      { name: "" }
  ],
  preview_url: ""
};

function WebPlayback(props: WebPlaybackProps) {
    const [is_paused, setPaused] = useState<boolean>(false);
    const [is_active, setActive] = useState<boolean>(false);
    const [player, setPlayer] = useState<Spotify.Player | undefined>(undefined);
    const [current_track, setTrack] = useState<Track>(track);
    const [query, setQuery] = useState<string>("");
    const [songs, setSongs] = useState<Song[]>([]);
    const [trackUrl, setTrackUrl] = useState<string>("");
    const sdkInitialized = useRef<boolean>(false);

    useEffect(() => {
        if (sdkInitialized.current) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player: Spotify.Player = new window.Spotify.Player({
              name: 'Web Playback SDK',
              getOAuthToken: (cb: (token: string) => void) => { cb(props.token); },
              volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }: { device_id: string }) => {
                console.log('✅ Ready with Device ID', device_id);
            });

            player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                console.log('❌ Device offline', device_id);
            });

            player.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
                if (!state) return;

                setTrack(state.track_window.current_track);
                setPaused(state.paused);

                player.getCurrentState().then((state: Spotify.PlaybackState | null) => {
                    setActive(!!state);
                });
            });

            player.connect();
        };

        sdkInitialized.current = true;

        return () => {
            if (player) {
                player.disconnect();
            }
        };
    }, [props.token]);

    const handleSearch = async () => {
        try {
            const response = await axios.get("http://localhost:5000/auth/search", {
                params: { query },
            });
            setSongs(response.data.results || []);
        } catch (error) {
            console.error("❌ Error fetching songs:", error);
        }
    };

    const playSong = async (trackUri: string) => {
        try {
            await axios.put(
                "https://api.spotify.com/v1/me/player/play",
                { uris: [trackUri] },
                { headers: { Authorization: `Bearer ${props.token}` } }
            );
        } catch (error) {
            console.error("❌ Error playing song:", error);
        }
    };

    const playSongByUrl = async () => {
        try {
            const response = await axios.get("http://localhost:5000/auth/play_by_url", {
                params: { url: trackUrl },
            });

            const trackUri = response.data.track_uri;
            if (trackUri) {
                await playSong(trackUri);
            }
        } catch (error) {
            console.error("❌ Error playing song by URL:", error);
        }
    };

    return (
        <>
            <div className="container">

                {is_active ? (
                    <div className="main-wrapper">
                        <main id={styles["container"]}>
                            <section id={styles["music-player-wrapper"]}>

                                <div id={styles["music-info"]}>
                                    <img id={styles["album-cover"]} src={current_track.album.images[0].url} alt="" />
                                    <div id={styles["track-info"]}>
                                        <p>{current_track.artists[0].name}</p>
                                        <h3>{current_track.name}</h3>
                                    </div>
                                </div>

                                <div id={styles["music-controls"]}>
                                    <button className="btn-spotify" onClick={() => player?.previousTrack()}>
                                        &lt;&lt;
                                    </button>
                                    <button className="btn-spotify" onClick={() => player?.togglePlay()}>
                                        {is_paused ? "PLAY" : "PAUSE"}
                                    </button>
                                    <button className="btn-spotify" onClick={() => player?.nextTrack()}>
                                        &gt;&gt;
                                    </button>
                                </div>
                            </section>

                            <section id={styles["search-wrapper"]}>
                                <input
                                    type="text"
                                    placeholder="Enter Spotify track URL"
                                    value={trackUrl}
                                    onChange={(e) => setTrackUrl(e.target.value)}
                                    />
                                <button onClick={playSongByUrl}>Play from URL</button>
                            </section>
                        </main>
                    </div>
                ) : (
                    <b> Instance not active. Transfer your playback device on the Spotify app. </b>
                )}
            </div>
        </>
    );
}

export default WebPlayback;
