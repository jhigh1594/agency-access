#!/usr/bin/env python3
"""
Generate AuthHub logo using Stable Diffusion 3.5 Large
Uses Hugging Face Inference API with proper authentication
"""

import requests
import os
from pathlib import Path

API_KEY = 'hf_YOUR_API_KEY_HERE'

def generate_logo():
    """
    Generate logo using Stable Diffusion 3.5 Large via Hugging Face Inference API
    """
    # Use the Inference API endpoint - router should handle it automatically
    # Try the model endpoint directly
    url = f"https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Unique, creative prompt for AuthHub logo
    prompt = """A distinctive, unique modern logo for AuthHub, an OAuth authentication platform. 
    Abstract geometric icon combining a stylized lock mechanism with interconnected authentication nodes forming a hub pattern. 
    Bold, angular design with sharp geometric shapes and flowing curves. 
    Modern tech aesthetic with vibrant coral orange (#FF6B35) and deep navy blue (#1A237E) gradient colors. 
    Minimalist flat design, vector illustration style, professional SaaS branding, 
    centered composition on white background, scalable icon suitable for digital platforms, 
    no text, icon only, clean lines, contemporary design"""
    
    # Simple payload format
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
    
    print("Generating logo with Stable Diffusion 3.5 Large...")
    print(f"Prompt: {prompt[:150]}...")
    print("This may take 30-60 seconds (model may need to load)...")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=180)
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            output_file = Path("apps/web/public/authhub-logo-sd35.png")
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Logo generated successfully!")
            print(f"   Saved to: {output_file.absolute()}")
            print(f"   Size: {len(response.content) / 1024:.2f} KB")
            return output_file
            
        elif response.status_code == 503:
            try:
                error_data = response.json()
                estimated_time = error_data.get("estimated_time", "unknown")
                print(f"⏳ Model is loading. Estimated time: {estimated_time} seconds")
                print("   Please wait and run the script again in a moment.")
            except:
                print("⏳ Model is loading. Please wait and try again.")
            return None
            
        else:
            error_text = response.text[:500]
            print(f"❌ Error: Status {response.status_code}")
            print(f"   Response: {error_text}")
            
            # If it says to use router, the endpoint might be redirecting
            if "router.huggingface.co" in error_text.lower():
                print("\n💡 The API endpoint format may have changed.")
                print("   Try visiting the Space directly: https://huggingface.co/spaces/stabilityai/stable-diffusion-3.5-large")
            
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
    result = generate_logo()
    if result:
        print(f"\n🎨 Logo ready for use in AuthHub branding!")
    else:
        print(f"\n💡 Tip: The model may need to be loaded. Try running again in a moment.")

