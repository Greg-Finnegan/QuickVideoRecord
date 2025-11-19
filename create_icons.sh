#!/bin/bash

# Create a simple red circle icon with white record dot using ImageMagick
# If ImageMagick is not available, we'll create simple placeholder PNGs

if command -v convert &> /dev/null; then
    # 16x16 icon
    convert -size 16x16 xc:none -draw "fill red circle 8,8 8,1 fill white circle 8,8 8,4" icon16.png
    
    # 48x48 icon
    convert -size 48x48 xc:none -draw "fill red circle 24,24 24,2 fill white circle 24,24 24,12" icon48.png
    
    # 128x128 icon
    convert -size 128x128 xc:none -draw "fill red circle 64,64 64,5 fill white circle 64,64 64,32" icon128.png
    
    echo "Icons created successfully with ImageMagick"
else
    echo "ImageMagick not found. Creating basic placeholder icons..."
    
    # Create simple solid color PNG placeholders using Python
    python3 << 'PYTHON'
from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw red circle
    draw.ellipse([2, 2, size-2, size-2], fill='#DB4437', outline='white', width=max(1, size//32))
    
    # Draw white record dot
    center = size // 2
    dot_size = size // 4
    draw.ellipse([center-dot_size, center-dot_size, center+dot_size, center+dot_size], fill='white')
    
    img.save(filename)
    print(f"Created {filename}")

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
PYTHON
fi
