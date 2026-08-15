import { StoryboardTemplate } from '@/types/onboarding';

export const STORYBOARD_TEMPLATES: StoryboardTemplate[] = [
  {
    id: 'podcast-ai-discussion',
    title: 'The Neural Beat: AI Episode',
    category: 'Podcast',
    description: 'A dynamic 2-person podcast interview breaking down real-time voice synthesis and acoustic vocoding.',
    durationEstimate: '45s',
    speakerCount: 2,
    recommendedVoice: 'Sarah (Expressive) + Michael (Professional)',
    tags: ['Podcast', 'Tech', 'Dialogue', 'Interview'],
    blocks: [
      {
        text: 'Welcome back to The Neural Beat! Today we are exploring zero-shot voice cloning with sub-millisecond latencies.',
        preset: 'sarah'
      },
      {
        text: 'Thanks for having me, Sarah. The leap from traditional concatenative TTS to neural vocoders like HiFi-GAN has been remarkable.',
        preset: 'michael'
      },
      {
        text: 'Exactly. By decoupling speaker identity embeddings from acoustic spectrograms, we preserve natural prosody and inflection.',
        preset: 'sarah'
      },
      {
        text: 'And streaming raw PCM chunks directly over WebSockets makes real-time voice synthesis practical for live conversations.',
        preset: 'michael'
      }
    ]
  },
  {
    id: 'audiobook-epic-fantasy',
    title: 'Chronicles of Aethelgard: The Spire',
    category: 'Audiobook',
    description: 'Rich narrative storytelling featuring an ancient storyteller voice with dynamic dialogue quotes.',
    durationEstimate: '55s',
    speakerCount: 2,
    recommendedVoice: 'Michael (Narrator) + Sarah (Mage)',
    tags: ['Fantasy', 'Audiobook', 'Storytelling', 'Dramatic'],
    blocks: [
      {
        text: 'The ancient spire pierced the storm-tethered heavens, its obsidian stones glowing with faint violet runes.',
        preset: 'michael'
      },
      {
        text: 'We must make haste before the eclipsed moon aligns with the altar!',
        preset: 'sarah'
      },
      {
        text: 'Whispered Lyra, her fingers tracing the incandescent glyphs etched into the forgotten gates.',
        preset: 'michael'
      },
      {
        text: 'The shadows whispered in response, awakening centuries of slumbering magic.',
        preset: 'michael'
      }
    ]
  },
  {
    id: 'gaming-cyberpunk-briefing',
    title: 'Neon Syndicate: Mission Briefing',
    category: 'Gaming',
    description: 'Immersive sci-fi cyberpunk fixer mission briefing designed for RPG and quest dialogues.',
    durationEstimate: '40s',
    speakerCount: 2,
    recommendedVoice: 'Michael (Fixer) + Default (Operator)',
    tags: ['Gaming', 'Cyberpunk', 'NPC', 'Sci-Fi'],
    blocks: [
      {
        text: 'Operative, listen up. The target payload is secured inside the Arasaka mainframe sub-level.',
        preset: 'michael'
      },
      {
        text: 'Countermeasures detected in sector 4. Bypassing ICE firewalls in three seconds.',
        preset: 'default'
      },
      {
        text: 'Extract the neural encryption key and meet the extraction transport on the upper deck.',
        preset: 'michael'
      }
    ]
  },
  {
    id: 'commercial-product-launch',
    title: 'EchoSync AI: Product Reveal',
    category: 'Commercial',
    description: 'High-energy commercial advertisement script with an attention-grabbing hook and call-to-action.',
    durationEstimate: '30s',
    speakerCount: 1,
    recommendedVoice: 'Sarah (Expressive)',
    tags: ['Commercial', 'Marketing', 'Promo', 'Fast-Paced'],
    blocks: [
      {
        text: 'Imagine generating studio-quality voiceovers in any accent or style in less than 200 milliseconds.',
        preset: 'sarah'
      },
      {
        text: 'Meet EchoSync AI. The zero-shot neural voice platform designed for creators, developers, and global storytellers.',
        preset: 'sarah'
      },
      {
        text: 'Try EchoSync AI free today and transform your audio workflows forever.',
        preset: 'sarah'
      }
    ]
  },
  {
    id: 'support-agent-dialogue',
    title: 'Enterprise Concierge: Client Resolution',
    category: 'Customer Support',
    description: 'Warm, professional interactive dialogue scenario between a support concierge and an enterprise client.',
    durationEstimate: '35s',
    speakerCount: 2,
    recommendedVoice: 'Sarah (Concierge) + Michael (Client)',
    tags: ['Support', 'Enterprise', 'IVR', 'Conversational'],
    blocks: [
      {
        text: 'Hello and thank you for calling EchoSync Premier Support. My name is Sarah, how may I assist you today?',
        preset: 'sarah'
      },
      {
        text: 'Hi Sarah, I would like to provision a dedicated streaming inference endpoint with custom rate limit allocations.',
        preset: 'michael'
      },
      {
        text: 'Certainly! I have initiated the cluster provisioning and emailed your secure deployment token.',
        preset: 'sarah'
      }
    ]
  }
];
