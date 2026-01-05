# AuthHub Logo Generation

This script generates a product logo for AuthHub using Hugging Face's Stable Diffusion model.

## Setup

1. **Get a free Hugging Face API key:**
   - Go to https://huggingface.co/settings/tokens
   - Create a new token with "Read" permissions
   - Copy the token

2. **Set the API key:**
   ```bash
   export HUGGING_FACE_API_KEY='your-token-here'
   ```
   
   Or add it to your `.env` file and source it.

3. **Install dependencies (if needed):**
   ```bash
   pip install requests
   ```

## Usage

```bash
python scripts/generate-authhub-logo.py
```

The logo will be saved to `apps/web/public/authhub-logo.png`

## Customization

Edit the `prompt` variable in the script to change the logo design:
- Modify colors, style, elements
- Adjust the description to match your vision
- The script uses Stable Diffusion 2.1 for high-quality generation

## Alternative: Using Hugging Face Spaces

You can also use Hugging Face Spaces with free image generation:
- Visit https://huggingface.co/spaces?search=stable+diffusion
- Use a Space like "stabilityai/stable-diffusion-2-1"
- Generate images directly in the browser


