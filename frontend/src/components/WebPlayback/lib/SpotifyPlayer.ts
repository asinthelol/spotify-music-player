import { useState, useEffect, useRef } from "react";
import { Track, SpotifyPlayer, PlaybackState } from "./types/spotifyTypes";

interface SpotifyPlayerProps {
    token: string;
    onTrackChange: (track: Track) => void;
    onDeviceChange: (deviceId: string) => void;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

export default function SpotifyPlayerComponent({ token, onTrackChange, onDeviceChange }: SpotifyPlayerProps) {
    const [player, setPlayer] = useState<SpotifyPlayer | undefined>(undefined);
    const sdkInitialized = useRef<boolean>(false);

    useEffect(() => {
        if (sdkInitialized.current) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const playerInstance: SpotifyPlayer = new window.Spotify.Player({
                name: "Web Playback Device",
                getOAuthToken: (cb: (token: string) => void) => { cb(token); },
                volume: 0.1 // IT GETS VERY LOUD, BE CAREFUL
            });

            setPlayer(playerInstance);

            playerInstance.addListener("ready", ({ device_id }: { device_id: string }) => {
                console.log("Device ID:", device_id);
                onDeviceChange(device_id);
            });

            playerInstance.addListener("not_ready", ({ device_id }: { device_id: string }) => {
                console.log("Device offline", device_id);
            });

            playerInstance.addListener("player_state_changed", (state: PlaybackState | null) => {
                if (!state) return;
                onTrackChange(state.track_window.current_track);

            });

            playerInstance.connect();
        };

        sdkInitialized.current = true;

        return () => {
            if (player) player.disconnect();
        };
    }, [token]);

    return player;
}
