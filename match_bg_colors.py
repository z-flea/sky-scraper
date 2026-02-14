#!/usr/bin/env python3
"""
匹配背景图片颜色
将 bg2 的底部颜色调整为与 bg1 顶部颜色一致
"""

from PIL import Image
import numpy as np

def get_average_color(image, region='top', sample_height=10):
    """获取图片指定区域的平均颜色"""
    width, height = image.size

    if region == 'top':
        # 获取顶部区域
        crop_box = (0, 0, width, sample_height)
    else:  # bottom
        # 获取底部区域
        crop_box = (0, height - sample_height, width, height)

    region_img = image.crop(crop_box)
    pixels = np.array(region_img)

    # 计算平均颜色（忽略 alpha 通道）
    avg_color = pixels[:, :, :3].mean(axis=(0, 1))
    return tuple(avg_color.astype(int))

def replace_background_color(image, target_color, tolerance=60):
    """将图片的背景色替换为目标颜色，保留其他内容（如白云）"""
    width, height = image.size
    img_array = np.array(image)

    # 获取原始背景色（使用底部区域的平均颜色）
    original_bg_color = get_average_color(image, region='bottom', sample_height=50)
    print(f'原始背景色: RGB{original_bg_color}')

    # 遍历所有像素
    for y in range(height):
        for x in range(width):
            pixel = img_array[y, x, :3]

            # 计算当前像素与原始背景色的距离
            color_distance = np.sqrt(np.sum((pixel - np.array(original_bg_color)) ** 2))

            # 如果像素颜色接近背景色，则替换为目标颜色
            if color_distance < tolerance:
                img_array[y, x, :3] = target_color

    return Image.fromarray(img_array)

def main():
    # 读取图片
    bg1 = Image.open('assets/sprites/dom/bg1.png').convert('RGBA')
    bg2 = Image.open('assets/sprites/dom/bg2.png').convert('RGBA')

    # 获取 bg1 顶部的平均颜色
    bg1_top_color = get_average_color(bg1, region='top', sample_height=20)
    print(f'bg1 顶部颜色: RGB{bg1_top_color}')

    # 获取 bg2 底部的当前颜色
    bg2_bottom_color = get_average_color(bg2, region='bottom', sample_height=20)
    print(f'bg2 底部颜色（修改前）: RGB{bg2_bottom_color}')

    # 将 bg2 的整个背景色替换为 bg1 顶部的颜色
    bg2_modified = replace_background_color(bg2, bg1_top_color)

    # 保存修改后的图片
    bg2_modified.save('assets/sprites/dom/bg2.png')
    print('bg2 已更新，底部颜色已匹配 bg1 顶部颜色')

    # 验证修改后的颜色（检查最底部的单个像素）
    bg2_new = Image.open('assets/sprites/dom/bg2.png').convert('RGBA')
    width, height = bg2_new.size
    bottom_pixel = bg2_new.getpixel((width // 2, height - 1))
    print(f'bg2 最底部像素颜色: RGB{bottom_pixel[:3]}')
    print(f'目标颜色: RGB{bg1_top_color}')
    print(f'颜色差异: R={abs(bottom_pixel[0] - bg1_top_color[0])}, G={abs(bottom_pixel[1] - bg1_top_color[1])}, B={abs(bottom_pixel[2] - bg1_top_color[2])}')

if __name__ == '__main__':
    main()
