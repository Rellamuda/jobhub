import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_rounded_mask(size, radius):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), size], radius=radius, fill=255)
    return mask

def generate_og():
    W, H = 1200, 630
    base = Image.new('RGBA', (W, H), (10, 10, 20, 255))
    draw = ImageDraw.Draw(base)

    # 1. High-tech subtle dark gradient
    for y in range(H):
        ratio = y / H
        r = int(10 + (18 - 10) * ratio)
        g = int(10 + (14 - 10) * ratio)
        b = int(22 + (36 - 22) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # 2. Ambient neon glows (cyan on top-left, deep purple on bottom-right)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([(-80, -80), (500, 500)], fill=(0, 240, 255, 30))
    glow_draw.ellipse([(700, 200), (1350, 750)], fill=(168, 85, 247, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    base = Image.alpha_composite(base, glow)

    # 3. Top accent brand gradient strip
    strip = Image.new('RGBA', (W, 6), (0, 0, 0, 0))
    strip_draw = ImageDraw.Draw(strip)
    for x in range(W):
        ratio = x / W
        r = int(0 + (168 - 0) * ratio)
        g = int(240 + (85 - 240) * ratio)
        b = int(255 + (247 - 255) * ratio)
        strip_draw.line([(x, 0), (x, 5)], fill=(r, g, b, 255))
    base.paste(strip, (0, 0), strip)

    draw = ImageDraw.Draw(base)

    # Fonts
    font_dir = "C:/Windows/Fonts"
    def get_font(name, size):
        path = os.path.join(font_dir, name)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
        return ImageFont.load_default()

    font_badge = get_font("segoeuib.ttf", 15)
    font_title = get_font("segoeuib.ttf", 64)
    font_sub = get_font("segoeuib.ttf", 26)
    font_desc = get_font("segoeui.ttf", 20)
    font_pill = get_font("segoeuib.ttf", 16)
    font_url = get_font("segoeuib.ttf", 22)
    font_tagline = get_font("segoeui.ttf", 17)

    # 4. Logo placement in a stylish rounded card (left side)
    logo_path = 'web/public/logo.png'
    if os.path.exists(logo_path):
        logo_img = Image.open(logo_path).convert('RGBA')
        logo_size = (310, 310)
        logo_resized = logo_img.resize(logo_size, Image.Resampling.LANCZOS)
        
        # Rounded mask for logo
        mask = create_rounded_mask(logo_size, radius=32)
        
        # Outer glow/border card
        card_x, card_y = 90, 150
        card_w, card_h = 330, 330
        
        # Card glow shadow
        shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sh_draw = ImageDraw.Draw(shadow)
        sh_draw.rounded_rectangle(
            [(card_x - 10, card_y - 10), (card_x + card_w + 10, card_y + card_h + 10)],
            radius=40,
            fill=(0, 240, 255, 30)
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(15))
        base = Image.alpha_composite(base, shadow)
        draw = ImageDraw.Draw(base)

        # Card container with border
        draw.rounded_rectangle(
            [(card_x, card_y), (card_x + card_w, card_y + card_h)],
            radius=36,
            fill=(20, 18, 38, 240),
            outline=(0, 240, 255, 180),
            width=2
        )
        
        # Paste logo inside card
        base.paste(logo_resized, (card_x + 10, card_y + 10), mask)

    # 5. Right-side content layout
    rx = 470

    # Badge: NEXT-GEN AUTONOMOUS HIRING & TALENT NETWORK
    badge_text = "⚡ NEXT-GEN AUTONOMOUS HIRING & TALENT NETWORK"
    badge_bbox = font_badge.getbbox(badge_text)
    bw = (badge_bbox[2] - badge_bbox[0]) + 30
    bh = 34
    by = 120
    draw.rounded_rectangle([(rx, by), (rx + bw, by + bh)], radius=17, fill=(0, 240, 255, 30), outline=(0, 240, 255, 110), width=1)
    draw.text((rx + 15, by + 7), badge_text, font=font_badge, fill=(0, 240, 255, 255))

    # Main Title: JobHub Global
    ty = 172
    draw.text((rx, ty), "JobHub Global", font=font_title, fill=(255, 255, 255, 255))

    # Subtitle: The Autonomous Career & Hiring Engine
    sy = ty + 78
    draw.text((rx, sy), "The Autonomous Career & Hiring Engine", font=font_sub, fill=(56, 189, 248, 255))

    # Key highlights
    dy = sy + 44
    draw.text((rx, dy), "Autonomous AI Matching  •  Verified Credentials  •  Smart ATS", font=font_desc, fill=(226, 232, 240, 230))

    # Feature pills
    py = dy + 48
    pills = [
        "✓ 1-Tap Auto Apply",
        "✓ Verified Employers",
        "✓ AI Resume Optimizer"
    ]
    px = rx
    for p in pills:
        pb = font_pill.getbbox(p)
        pw = (pb[2] - pb[0]) + 22
        ph = 32
        draw.rounded_rectangle([(px, py), (px + pw, py + ph)], radius=8, fill=(255, 255, 255, 15), outline=(255, 255, 255, 35), width=1)
        draw.text((px + 11, py + 6), p, font=font_pill, fill=(241, 245, 249, 240))
        px += pw + 12

    # Bottom footer card
    fy = 480
    fw = 640
    fh = 54
    draw.rounded_rectangle([(rx, fy), (rx + fw, fy + fh)], radius=14, fill=(16, 22, 38, 200), outline=(0, 240, 255, 70), width=1)
    draw.text((rx + 18, fy + 14), "🌐 skillskonnect.online", font=font_url, fill=(0, 240, 255, 255))
    draw.text((rx + 330, fy + 17), "Global Career Ecosystem", font=font_tagline, fill=(148, 163, 184, 255))

    # Save to both target files
    final_rgb = base.convert('RGB')
    final_rgb.save('web/public/og-image.png', quality=95)
    final_rgb.save('web/public/jobhub-global-og.png', quality=95)
    print("SUCCESS: Generated web/public/og-image.png and web/public/jobhub-global-og.png (1200x630)")

if __name__ == '__main__':
    generate_og()
