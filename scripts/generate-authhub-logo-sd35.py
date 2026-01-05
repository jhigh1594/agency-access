#!/usr/bin/env python3
"""
Generate AuthHub logo using Stable Diffusion 3.5 Large via Hugging Face Inference API
"""

import requests
import json
import os
from pathlib import Path

# Hugging Face Inference API endpoint for Stable Diffusion 3.5 Large
# Using router endpoint (new format)
API_URL = "https://router.huggingface.co/models/stabilityai/stable-diffusion-3.5-large"
API_KEY = os.getenv('HUGGING_FACE_API_KEY', 'hf_YOUR_API_KEY_HERE')

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def generate_logo(prompt: str, output_path: str = "apps/web/public/authhub-logo-sd35.png"):
    """
    Generate logo image using Hugging Face Inference API
    
    Args:
        prompt: Text description of the logo to generate
        output_path: Path where the generated image will be saved
    """
    print(f"Generating logo with Stable Diffusion 3.5 Large...")
    print(f"Prompt: {prompt[:150]}...")
    print("This may take 30-60 seconds (model may need to load)...")
    
    # Router endpoint uses different payload format
    payload = {
        "inputs": prompt,
        "parameters": {
            "width": 1024,
            "height": 1024,
            "num_inference_steps": 50,
            "guidance_scale": 7.0,
            "negative_prompt": "text, watermark, signature, low quality, blurry, distorted, amateur, unprofessional"
        }
    }
    
    # Also try alternative payload format for router
    payload_alt = prompt  # Some endpoints just take the prompt directly
    
    try:
        # Try with full payload first
        response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=120)
        
        # If that fails with 404/400, try simpler format
        if response.status_code in [404, 400]:
            print("Trying alternative payload format...")
            response = requests.post(API_URL, headers=HEADERS, json={"inputs": prompt}, timeout=120)
        
        if response.status_code == 200:
            # Save the image
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Logo generated successfully: {output_file}")
            print(f"   File size: {len(response.content) / 1024:.2f} KB")
            return output_file
        elif response.status_code == 503:
            # Model is loading
            try:
                error_data = response.json()
                estimated_time = error_data.get("estimated_time", "unknown")
                print(f"⏳ Model is loading. Estimated time: {estimated_time} seconds")
            except:
                print("⏳ Model is loading. Please wait and try again in a moment.")
            return None
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get("error", "Unknown error")
                print(f"❌ Error generating logo: {error_msg}")
            except:
                print(f"❌ Error generating logo: {response.text[:500]}")
            print(f"   Status code: {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out. The model may be taking longer than expected.")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Unique, creative prompt for AuthHub logo - abstract geometric design
    prompt = """A distinctive, unique modern logo for AuthHub, an OAuth authentication platform. 
    Abstract geometric icon combining a stylized lock mechanism with interconnected authentication nodes forming a hub pattern. 
    Bold, angular design with sharp geometric shapes and flowing curves. 
    Modern tech aesthetic with vibrant coral orange (#FF6B35) and deep navy blue (#1A237E) gradient colors. 
    Minimalist flat design, vector illustration style, professional SaaS branding, 
    centered composition on white background, scalable icon suitable for digital platforms, 
    no text, icon only, clean lines, contemporary design"""
    
    # Generate logo
    result = generate_logo(prompt, "apps/web/public/authhub-logo-sd35.png")
    
    if result:
        print(f"\n🎨 Logo saved to: {result.absolute()}")
        print("   You can now use this in your AuthHub branding!")
    else:
        print("\n💡 Tip: If the model is loading, wait a moment and run the script again.")
