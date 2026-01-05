#!/usr/bin/env python3
"""
Generate AuthHub logo using Stable Diffusion 3.5 Large via Hugging Face Hub
Uses the official huggingface_hub library which handles routing automatically
"""

from huggingface_hub import InferenceClient
from pathlib import Path
import os

API_KEY = os.getenv('HUGGING_FACE_API_KEY', 'hf_YOUR_API_KEY_HERE')

def generate_logo(prompt: str, output_path: str = "apps/web/public/authhub-logo-sd35.png"):
    """
    Generate logo image using Hugging Face Inference API via huggingface_hub
    
    Args:
        prompt: Text description of the logo to generate
        output_path: Path where the generated image will be saved
    """
    print(f"Generating logo with Stable Diffusion 3.5 Large...")
    print(f"Prompt: {prompt[:150]}...")
    print("This may take 30-60 seconds (model may need to load)...")
    
    try:
        # Create InferenceClient - automatically uses router
        client = InferenceClient(token=API_KEY)
        
        # Generate image
        image = client.text_to_image(
            prompt=prompt,
            model="stabilityai/stable-diffusion-3.5-large",
            negative_prompt="text, watermark, signature, low quality, blurry, distorted, amateur, unprofessional",
            width=1024,
            height=1024,
            num_inference_steps=50,
            guidance_scale=7.0
        )
        
        # Save the image
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        image.save(output_file)
        
        print(f"✅ Logo generated successfully: {output_file}")
        print(f"   File size: {os.path.getsize(output_file) / 1024:.2f} KB")
        return output_file
        
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
        print("\n💡 Tip: Check the error message above for details.")

