# HeyGen API reference for Mira Skill V1

Verified production path as of 2026-07-22:

- `GET /v3/users/me` — API wallet and account preflight.
- `GET /v3/avatars/looks/{look_id}` — validate one Look without downloading a large avatar catalog.
- `GET /v3/voices?type=private&limit=100` and `type=public` — validate/select a voice.
- `POST /v3/videos` — create one avatar video.
- `GET /v3/videos/{video_id}` — poll and obtain the completed output URL.

Use `x-api-key`. API-key billing uses the separate prepaid API wallet; it does not consume the web subscription credits. Never store the key in output metadata.

## Mira defaults

- Avatar group / identity: `79c2be66e29c41728668693fc334ca02`
- Current gray-shirt Look ID used as `avatar_id`: `8dabf36660d74afb9c65a52cf1bf20ab`
- Current voice ID: `154e13cce06c4452ba3b9865dcdf1434`
- Look type: `photo_avatar`
- Engine: `avatar_iv`
- Output: `1080p`, `9:16`, MP4

The group ID identifies Mira's avatar group. The Look ID identifies the specific appearance and is the value required by `POST /v3/videos` as `avatar_id`.

## Create-video payload

V1 uses this shape and deliberately omits caption settings:

```json
{
  "type": "avatar",
  "avatar_id": "LOOK_ID",
  "title": "TITLE",
  "resolution": "1080p",
  "aspect_ratio": "9:16",
  "fit": "cover",
  "output_format": "mp4",
  "script": "CONFIRMED_SCRIPT",
  "voice_id": "VOICE_ID",
  "voice_settings": {
    "speed": 1.0,
    "pitch": 0,
    "volume": 1.0
  },
  "expressiveness": "low",
  "engine": {"type": "avatar_iv"}
}
```

Avatar IV is the current photo-avatar baseline. Check `supported_api_engines` on a Look before changing engines. `motion_prompt` and `expressiveness` are Avatar-IV photo-avatar controls; do not add them casually because they can change identity consistency and body motion.

## Pricing assumptions

Official self-serve API rate for Photo Avatar IV/V at 720p or 1080p is `$0.05/output-second`, equivalent to `$3.00/output-minute`. 4K is `$0.0667/output-second`, about `$4.00/output-minute`. HeyGen bills successful output by duration.

Observed Mira full validation on 2026-07-22:

- 132 words
- 49.5804 seconds
- wallet change `$4.60` to `$2.15`
- observed cost `$2.45`
- theoretical duration cost `$2.48`
- submit-to-complete 220 seconds

The preflight estimate uses word count and an estimated WPM, then adds a safety factor. It is a budget gate, not the final billed amount.

## Changing appearance

- Switching to an already-created Look changes only `avatar_id`; there is no separately listed API fee for selecting an existing Look. The generated video still costs the normal per-second rate.
- Creating a new Photo Avatar through the self-serve API is listed at `$1.00 per call` before any video-generation cost.
- In HeyGen's web credit plan, `Generate Look` is listed as 1 credit per Look. Web credits and the API-key wallet are separate billing systems.
- Always generate an 8–12 second canary for a new Look and inspect identity, crop, background, mouth, teeth, eyes, and body motion.

## Changing voice

- Selecting another existing voice ID or changing speed/pitch/volume has no separately listed setup charge in the create-video pricing table; the finished avatar video is still billed at the normal per-second video rate.
- The web Creator plan includes voice cloning, but the self-serve API pricing page does not publish a distinct voice-cloning per-call fee. Verify the current product UI/API terms before creating a new cloned voice.
- A standalone Starfish text-to-speech endpoint is priced separately at `$0.000667/audio-second`, about `$0.04/minute`; this Skill does not call standalone TTS.
- Changing speed can change duration and therefore final cost. Run a short canary before adopting a new default.

Official sources:

- https://developers.heygen.com/reference/create-video
- https://developers.heygen.com/reference/get-video
- https://developers.heygen.com/reference/list-voices
- https://developers.heygen.com/docs/pricing
- https://help.heygen.com/en/articles/15125761-heygen-credit-based-pricing-plans-explained
