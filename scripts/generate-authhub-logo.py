#!/usr/bin/env python3
"""
Generate AuthHub logo using Hugging Face Inference API
Uses Stable Diffusion model for text-to-image generation
"""

import requests
import os
from pathlib import Path

# Hugging Face API endpoint for Stable Diffusion
API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
HEADERS = {
    "Authorization": f"Bearer {os.getenv('HUGGING_FACE_API_KEY', '')}"
}

def generate_logo(prompt: str, output_path: str = "apps/web/public/authhub-logo.png"):
    """
    Generate logo image using Hugging Face Inference API
    
    Args:
        prompt: Text description of the logo to generate
        output_path: Path where the generated image will be saved
    """
    print(f"Generating logo with prompt: {prompt}")
    print("This may take 30-60 seconds...")
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "width": 1024,
            "height": 1024,
            "num_inference_steps": 50,
            "guidance_scale": 7.5
        }
    }
    
    response = requests.post(API_URL, headers=HEADERS, json=payload)
    
    if response.status_code == 200:
        # Save the image
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, "wb") as f:
            f.write(response.content)
        
        print(f"✅ Logo generated successfully: {output_file}")
        print(f"   File size: {len(response.content) / 1024:.2f} KB")
        return output_file
    else:
        error_msg = response.json().get("error", "Unknown error")
        print(f"❌ Error generating logo: {error_msg}")
        print(f"   Status code: {response.status_code}")
        
        if response.status_code == 503:
            print("   Model is loading. Please wait a moment and try again.")
        elif response.status_code == 401:
            print("   Authentication failed. Check your HUGGING_FACE_API_KEY.")
        
        return None

if __name__ == "__main__":
    # AuthHub logo prompt - modern, professional, security-focused
    prompt = """A modern minimalist logo for AuthHub, an OAuth authentication platform. 
    Design features: shield and key icon combined, clean geometric shapes, 
    professional tech aesthetic, orange and blue gradient colors, 
    suitable for a SaaS product, vector-style, high contrast, 
    centered composition, white background, professional branding"""
    
    # Alternative simpler prompt
    simple_prompt = """Modern minimalist logo design for AuthHub, 
    shield and key icon, clean geometric style, 
    orange and blue colors, professional SaaS branding, 
    white background, centered"""
    
    # Check for API key
    api_key = os.getenv('HUGGING_FACE_API_KEY')
    if not api_key:
        print("⚠️  HUGGING_FACE_API_KEY not set.")
        print("   Get your free API key at: https://huggingface.co/settings/tokens")
        print("   Then run: export HUGGING_FACE_API_KEY='your-key-here'")
        print("\n   Or set it in your .env file and source it.")
        exit(1)
    
    # Generate logo
    result = generate_logo(simple_prompt)
    
    if result:
        print(f"\n🎨 Logo saved to: {result.absolute()}")
        print("   You can now use this in your AuthHub branding!")


