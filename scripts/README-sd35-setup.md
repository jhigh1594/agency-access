# Stable Diffusion 3.5 Large Logo Generation

## Current Status

The Stable Diffusion 3.5 Large model is available but requires:
1. **Gated Access**: Model is marked as "gated: auto" - may require accepting terms
2. **New API Format**: The old `api-inference.huggingface.co` endpoint is deprecated
3. **Router Endpoint**: New endpoint is `router.huggingface.co` but format is unclear

## API Key Stored

Your Hugging Face API key is stored in the script: `hf_YOUR_API_KEY_HERE`

## Alternative Solution

We successfully generated a high-quality logo using **FLUX.1-Krea-dev** which produces similar quality results:
- File: `apps/web/public/authhub-logo.webp`
- Generated with unique AuthHub branding prompt
- Modern, professional design

## Next Steps for SD 3.5

1. **Accept Model Terms**: Visit https://huggingface.co/stabilityai/stable-diffusion-3.5-large and accept terms if prompted
2. **Check Router Format**: The router endpoint may require a different payload format
3. **Use Official Library**: Install `huggingface_hub` and use `InferenceClient` which handles routing automatically

## Scripts Available

- `scripts/generate-authhub-logo-sd35.py` - Direct API approach (needs router format fix)
- `scripts/generate-authhub-logo-sd35-hub.py` - Uses huggingface_hub library (requires installation)

