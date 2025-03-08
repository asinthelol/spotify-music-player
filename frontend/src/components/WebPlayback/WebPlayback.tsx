import { useState, useEffect } from "react";
import SpotifyPlayerComponent from "./lib/SpotifyPlayer";
import { Track } from "./lib/types/spotifyTypes";
import styles from "./webplayback.module.scss";
import '@fortawesome/fontawesome-free/css/all.min.css';

interface WebPlaybackProps {
    token: string;
}

export default function WebPlayback({ token }: WebPlaybackProps) {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    // Initialize the Spotify player.
    const player = SpotifyPlayerComponent({
        token,
        onTrackChange: setCurrentTrack,
        onDeviceChange: () => {},
    });

    // Helper function to truncate text.
    const truncateText = (text: string, maxLength: number) => 
        text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

    // Only exists to update paused value.
    useEffect(() => {
        if (!player) return;

        const handleStateChange = (state: any) => {
            if (state) {
                setIsPaused(state.paused);
            }
        };
        player.addListener("player_state_changed", handleStateChange);

        return () => player.removeListener("player_state_changed", handleStateChange);
    }, [player]);

    const albumCover = currentTrack?.album.images[0].url || "";
    const artists = currentTrack ? currentTrack.artists.map(artist => artist.name).join(", ") : "";
    const trackName = currentTrack?.name || "";

    return (
        <section id={styles.container}>
            <div id={styles["album-cover-wrapper"]}>
                <div id={styles.overlay} />
                <div
                    id={styles["album-cover"]}
                    style={{ backgroundImage: `url(${albumCover})` }}
                    data-name="album-cover"
                >
                    {!currentTrack && <p>Switch device player in the Spotify App!</p>}
                </div>
                <p>{truncateText(artists, 12)}</p>
                <h3>{truncateText(trackName, 12)}</h3>
            </div>

            <div id={styles["playback-wrapper"]}>
                <button onClick={() => player?.previousTrack()}>
                    <i className="fa-solid fa-backward"></i>
                </button>
                <button onClick={() => player?.togglePlay()}>
                    <i className={`fas fa-${isPaused ? "play" : "pause"}`} id={styles["play-button"]}></i>
                </button>
                <button onClick={() => player?.nextTrack()}>
                    <i className="fa-solid fa-forward"></i>
                </button>
            </div>
        </section>
    );
}
