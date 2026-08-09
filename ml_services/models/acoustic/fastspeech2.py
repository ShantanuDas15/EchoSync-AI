import torch
import torch.nn as nn
from g2p_en import G2p
import unidecode
from .length_regulator import LengthRegulator

class Phonemizer:
    def __init__(self):
        self.g2p = G2p()
        # ARPAbet token mapping
        symbols = ['<pad>', '<unk>', '<eos>'] + \
            [chr(i) for i in range(32, 127)] + \
            ['AA', 'AA0', 'AA1', 'AA2', 'AE', 'AE0', 'AE1', 'AE2', 'AH', 'AH0', 'AH1', 'AH2',
             'AO', 'AO0', 'AO1', 'AO2', 'AW', 'AW0', 'AW1', 'AW2', 'AY', 'AY0', 'AY1', 'AY2',
             'B', 'CH', 'D', 'DH', 'EH', 'EH0', 'EH1', 'EH2', 'ER', 'ER0', 'ER1', 'ER2', 'EY',
             'EY0', 'EY1', 'EY2', 'F', 'G', 'HH', 'IH', 'IH0', 'IH1', 'IH2', 'IY', 'IY0', 'IY1',
             'IY2', 'JH', 'K', 'L', 'M', 'N', 'NG', 'OW', 'OW0', 'OW1', 'OW2', 'OY', 'OY0',
             'OY1', 'OY2', 'P', 'R', 'S', 'SH', 'T', 'TH', 'UH', 'UH0', 'UH1', 'UH2', 'UW',
             'UW0', 'UW1', 'UW2', 'V', 'W', 'Y', 'Z', 'ZH']
        self.symbol_to_id = {s: i for i, s in enumerate(symbols)}
        
    def __call__(self, text):
        text = unidecode.unidecode(text)
        phonemes = self.g2p(text)
        seq = [self.symbol_to_id.get(p, self.symbol_to_id['<unk>']) for p in phonemes]
        return torch.tensor(seq, dtype=torch.long)

class VariancePredictor(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.conv1 = nn.Conv1d(hidden_size, hidden_size, kernel_size=3, padding=1)
        self.ln1 = nn.LayerNorm(hidden_size)
        self.dropout1 = nn.Dropout(0.1)
        self.conv2 = nn.Conv1d(hidden_size, hidden_size, kernel_size=3, padding=1)
        self.ln2 = nn.LayerNorm(hidden_size)
        self.dropout2 = nn.Dropout(0.1)
        self.linear = nn.Linear(hidden_size, 1)

    def forward(self, x):
        # x: (B, T, H)
        x_conv = self.conv1(x.transpose(1, 2)).transpose(1, 2)
        x = torch.relu(x_conv)
        x = self.ln1(x)
        x = self.dropout1(x)
        
        x_conv = self.conv2(x.transpose(1, 2)).transpose(1, 2)
        x = torch.relu(x_conv)
        x = self.ln2(x)
        x = self.dropout2(x)
        
        return self.linear(x).squeeze(-1)

class FastSpeech2(nn.Module):
    def __init__(self, vocab_size=300, hidden_size=256, speaker_emb_dim=256, mel_dim=80):
        super().__init__()
        self.phonemizer = Phonemizer()
        self.src_word_emb = nn.Embedding(vocab_size, hidden_size)
        
        # Simplified FFT Block representation for Text Encoder
        self.encoder = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.TransformerEncoderLayer(d_model=hidden_size, nhead=2, dim_feedforward=hidden_size*4, dropout=0.1, batch_first=True)
        )
        
        # Variance predictors
        self.duration_predictor = VariancePredictor(hidden_size + speaker_emb_dim)
        self.pitch_predictor = VariancePredictor(hidden_size + speaker_emb_dim)
        self.energy_predictor = VariancePredictor(hidden_size + speaker_emb_dim)
        
        self.length_regulator = LengthRegulator()
        
        self.pitch_emb = nn.Conv1d(1, hidden_size + speaker_emb_dim, kernel_size=3, padding=1)
        self.energy_emb = nn.Conv1d(1, hidden_size + speaker_emb_dim, kernel_size=3, padding=1)
        
        # Simplified FFT Block for Mel Decoder
        self.decoder = nn.TransformerEncoderLayer(d_model=hidden_size + speaker_emb_dim, nhead=2, dim_feedforward=(hidden_size + speaker_emb_dim)*4, dropout=0.1, batch_first=True)
        
        self.mel_linear = nn.Linear(hidden_size + speaker_emb_dim, mel_dim)
        
    def forward(self, text, speaker_emb, durations=None, pitch=None, energy=None):
        """
        text: list of strings or tensor of shape (B, T)
        speaker_emb: (B, speaker_emb_dim)
        """
        if isinstance(text, list):
            seqs = [self.phonemizer(t) for t in text]
            max_len = max(len(s) for s in seqs)
            padded = torch.zeros(len(seqs), max_len, dtype=torch.long)
            for i, s in enumerate(seqs):
                padded[i, :len(s)] = s
            text = padded.to(speaker_emb.device)
            
        x = self.src_word_emb(text)
        x = self.encoder(x) # (B, T_text, hidden_size)
        
        # Concatenate 256-d GE2E speaker vector onto text encoder outputs
        B, T, H = x.shape
        speaker_emb_expanded = speaker_emb.unsqueeze(1).expand(B, T, -1)
        x = torch.cat([x, speaker_emb_expanded], dim=-1) # (B, T, H + speaker_emb_dim)
        
        # Variance prediction
        log_d_prediction = self.duration_predictor(x)
        p_prediction = self.pitch_predictor(x)
        e_prediction = self.energy_predictor(x)
        
        if durations is None:
            # inference
            d_rounded = torch.clamp(torch.round(torch.exp(log_d_prediction) - 1), min=2).long()
        else:
            d_rounded = durations
            
        if pitch is None:
            pitch = p_prediction
        if energy is None:
            energy = e_prediction
            
        # Add pitch and energy embeddings
        p_emb = self.pitch_emb(pitch.unsqueeze(1)).transpose(1, 2)
        e_emb = self.energy_emb(energy.unsqueeze(1)).transpose(1, 2)
        x = x + p_emb + e_emb
            
        x = self.length_regulator(x, d_rounded) # (B, T_mel, H + speaker_emb_dim)
        
        if x.size(1) == 0:
            x = torch.zeros(B, 1, x.size(-1)).to(x.device)
            
        x = self.decoder(x)
        mel_prediction = self.mel_linear(x) # (B, T_mel, 80)
        
        return mel_prediction.transpose(1, 2) # (B, 80, T_mel)
