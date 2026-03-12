from PIL import Image
import os

def check_transparency(path):
    try:
        img = Image.open(path)
        if img.mode == 'RGBA':
            extrema = img.getextrema()
            alpha_extrema = extrema[3]
            if alpha_extrema[0] < 255:
                print(f"VERDICT: {os.path.basename(path)} is TRANSPARENT (min alpha: {alpha_extrema[0]})")
            else:
                print(f"VERDICT: {os.path.basename(path)} is OPAQUE (alpha is 255)")
        else:
            print(f"VERDICT: {os.path.basename(path)} NO ALPHA (mode: {img.mode})")
    except Exception as e:
        print(f"ERROR processing {path}: {e}")

# Check both generated images
check_transparency(r'C:\Users\bc222110\.gemini\antigravity\brain\fdafbe56-11d2-4f88-9792-7daee0d9c98a\logo_transparente_final_1773328016021.png')
check_transparency(r'C:\Users\bc222110\.gemini\antigravity\brain\fdafbe56-11d2-4f88-9792-7daee0d9c98a\logo_transparente_v1_1773325674948.png')
