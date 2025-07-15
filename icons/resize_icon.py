#!/usr/bin/env python3
import os

from PIL import Image


def resize_icon(source_path, output_dir, sizes):
    """
    Resize an icon to multiple sizes.

    Args:
        source_path: Path to the source icon file
        output_dir: Directory where resized icons will be saved
        sizes: List of sizes (in pixels) to generate
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Open the source image
    try:
        with Image.open(source_path) as img:
            # Check if image was opened successfully
            print(f"Source image: {source_path}, Size: {img.size}, Mode: {img.mode}")

            # Convert to RGBA if not already
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            # Resize and save for each size
            for size in sizes:
                resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
                output_path = os.path.join(output_dir, f"icon-{size}.png")
                resized_img.save(output_path)
                print(f"Saved {size}x{size} icon to {output_path}")

    except Exception as e:
        print(f"Error processing image: {e}")
        return False

    return True


if __name__ == "__main__":
    # Define the sizes needed for the extension
    sizes = [16, 19, 32, 38, 48, 96, 128]

    # Source icon path and output directory
    source_path = "icon.png"
    output_dir = "."

    print(f"Resizing icon {source_path} to {len(sizes)} different sizes...")

    if resize_icon(source_path, output_dir, sizes):
        print("Icon resizing completed successfully!")
    else:
        print("Failed to resize icon.")
