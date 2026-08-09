import torch
import torch.nn as nn

class LengthRegulator(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x, durations, mel_max_length=None):
        """
        x: (batch_size, text_len, hidden_size)
        durations: (batch_size, text_len)
        mel_max_length: int optional
        Returns:
            out_padded: (batch_size, max_len, hidden_size)
        """
        batch_size, text_len, hidden_size = x.size()
        
        output = []
        for i in range(batch_size):
            # repeat each phoneme state according to its predicted duration
            expanded_seq = torch.repeat_interleave(x[i], durations[i], dim=0)
            output.append(expanded_seq)
            
        if mel_max_length:
            max_len = mel_max_length
        else:
            max_len = max([seq.size(0) for seq in output])
            # Ensure at least length 1 to avoid empty tensors
            max_len = max(max_len, 1)
            
        out_padded = torch.zeros(batch_size, max_len, hidden_size).to(x.device)
        for i in range(batch_size):
            seq_len = output[i].size(0)
            out_padded[i, :seq_len] = output[i]
            
        return out_padded
