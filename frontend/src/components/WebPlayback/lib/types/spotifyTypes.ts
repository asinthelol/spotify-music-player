export interface Track {
  name: string;
  album: {
      images: { url: string }[];
  };
  artists: { name: string }[];
  preview_url: string;
}

export interface Song {
  id: string;
  name: string;
  album: {
      images: { url: string }[];
  };
  artists: { name: string }[];
  uri: string;
}

export interface Artist {
  name: string;
}

export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<PlaybackState | null>;
  addListener(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback?: (data: any) => void): void;
  previousTrack(): void;
  togglePlay(): void;
  nextTrack(): void;
}

export interface PlaybackState {
  paused: boolean;
  track_window: {
      current_track: Track;
  };
}
