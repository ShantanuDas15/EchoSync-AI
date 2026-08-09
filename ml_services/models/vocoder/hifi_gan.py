import torch
import torch.nn as nn
import torch.nn.functional as F

class ResBlock1(nn.Module):
    def __init__(self, channels, kernel_size=3, dilation=(1, 3, 5)):
        super().__init__()
        self.convs1 = nn.ModuleList([
            nn.Conv1d(channels, channels, kernel_size, 1, dilation=d, padding=(kernel_size - 1) * d // 2) 
            for d in dilation
        ])
        self.convs2 = nn.ModuleList([
            nn.Conv1d(channels, channels, kernel_size, 1, dilation=1, padding=(kernel_size - 1) // 2)
            for _ in dilation
        ])

    def forward(self, x):
        for c1, c2 in zip(self.convs1, self.convs2):
            xt = F.leaky_relu(x, 0.1)
            xt = c1(xt)
            xt = F.leaky_relu(xt, 0.1)
            xt = c2(xt)
            x = x + xt
        return x

class HiFiGANGenerator(nn.Module):
    def __init__(self, initial_channel=128, resblock_kernel_sizes=(3,7,11), 
                 resblock_dilation_sizes=((1,3,5), (1,3,5), (1,3,5)), 
                 upsample_rates=(8,8,2,2), upsample_initial_channel=128, 
                 upsample_kernel_sizes=(16,16,4,4),
                 mel_channels=80):
        super().__init__()
        self.num_kernels = len(resblock_kernel_sizes)
        self.num_upsamples = len(upsample_rates)
        
        self.conv_pre = nn.Conv1d(mel_channels, upsample_initial_channel, 7, 1, padding=3)
        
        self.ups = nn.ModuleList()
        for i, (u, k) in enumerate(zip(upsample_rates, upsample_kernel_sizes)):
            self.ups.append(
                nn.ConvTranspose1d(upsample_initial_channel // (2**i), 
                                   upsample_initial_channel // (2**(i+1)), 
                                   k, u, padding=(k-u)//2)
            )
            
        self.resblocks = nn.ModuleList()
        for i in range(len(self.ups)):
            ch = upsample_initial_channel // (2**(i+1))
            for j, (k, d) in enumerate(zip(resblock_kernel_sizes, resblock_dilation_sizes)):
                self.resblocks.append(ResBlock1(ch, k, d))
                
        self.conv_post = nn.Conv1d(ch, 1, 7, 1, padding=3)
        
    def forward(self, x):
        # x: (B, 80, T_mel)
        x = self.conv_pre(x)
        for i in range(self.num_upsamples):
            x = F.leaky_relu(x, 0.1)
            x = self.ups[i](x)
            
            xs = None
            for j in range(self.num_kernels):
                if xs is None:
                    xs = self.resblocks[i*self.num_kernels + j](x)
                else:
                    xs += self.resblocks[i*self.num_kernels + j](x)
            x = xs / self.num_kernels
            
        x = F.leaky_relu(x, 0.1)
        x = self.conv_post(x)
        x = torch.tanh(x)
        return x
        
    def synthesize_pcm(self, mel):
        """
        Synthesize 22.05 kHz 16-bit time-domain PCM audio from log-mel spectrogram.
        Returns: numpy array of int16
        """
        with torch.no_grad():
            wav = self.forward(mel).squeeze().cpu().numpy()
        # Scale to 16-bit PCM
        wav = wav * 32767.0
        # Clip
        wav = wav.clip(-32768, 32767)
        return wav.astype('int16')
