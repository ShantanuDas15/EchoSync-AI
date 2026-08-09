import numpy as np

class SlidingWindowVocoderChunker:
    def __init__(self, sample_rate=22050, window_duration_ms=50, crossfade_duration_ms=10):
        self.sample_rate = sample_rate
        self.window_samples = int(sample_rate * (window_duration_ms / 1000.0))
        self.crossfade_samples = int(sample_rate * (crossfade_duration_ms / 1000.0))
        
        # Linear crossfade curve
        self.fade_in = np.linspace(0, 1, self.crossfade_samples)
        self.fade_out = np.linspace(1, 0, self.crossfade_samples)
        
        self.buffer = None

    def process_chunk(self, new_chunk):
        """
        new_chunk: 1D numpy array of audio samples (PCM int16 or float32)
        Returns: continuous chunk of audio after crossfading
        """
        if self.buffer is None:
            # First chunk
            # Keep the last 'crossfade_samples' in buffer for next time
            if len(new_chunk) > self.crossfade_samples:
                self.buffer = new_chunk[-self.crossfade_samples:]
                return new_chunk[:-self.crossfade_samples]
            else:
                self.buffer = new_chunk
                return np.array([], dtype=new_chunk.dtype)
        
        # We have a buffer, crossfade the overlapping part
        overlap_len = min(len(self.buffer), len(new_chunk), self.crossfade_samples)
        if overlap_len == 0:
            return new_chunk
            
        crossfaded = (self.buffer[-overlap_len:] * self.fade_out[:overlap_len] + 
                      new_chunk[:overlap_len] * self.fade_in[:overlap_len])
                      
        # Update buffer
        if len(new_chunk) > self.crossfade_samples:
            out_chunk = np.concatenate([crossfaded, new_chunk[overlap_len:-self.crossfade_samples]])
            self.buffer = new_chunk[-self.crossfade_samples:]
        else:
            out_chunk = np.concatenate([crossfaded, new_chunk[overlap_len:]])
            self.buffer = out_chunk[-overlap_len:] if len(out_chunk) > 0 else np.array([])
            out_chunk = np.array([], dtype=new_chunk.dtype)
            
        return out_chunk.astype(new_chunk.dtype)
