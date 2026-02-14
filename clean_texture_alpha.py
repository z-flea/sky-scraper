#!/usr/bin/env python3
"""
清理纹理的 alpha 通道，将半透明像素设置为完全透明
"""

from PIL import Image
import os

def clean_texture_alpha(input_path, output_path, alpha_threshold=230):
    """
    清理纹理的 alpha 通道，将半透明像素设置为完全透明

    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径
        alpha_threshold: alpha 阈值（0-255），低于此值的像素将被设置为完全透明
    """
    # 打开图片
    img = Image.open(input_path)

    # 确保图片有 alpha 通道
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # 获取像素数据
    pixels = img.load()
    width, height = img.size

    # 统计信息
    transparent_count = 0
    semi_transparent_count = 0
    opaque_count = 0

    # 处理每个像素
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]

            if a < alpha_threshold:
                # 将半透明像素设置为完全透明
                pixels[x, y] = (r, g, b, 0)
                if a > 0:
                    semi_transparent_count += 1
                else:
                    transparent_count += 1
            else:
                # 保持不透明像素
                opaque_count += 1

    # 保存处理后的图片
    img.save(output_path, 'PNG')

    print(f"处理完成: {input_path}")
    print(f"  - 完全透明像素: {transparent_count}")
    print(f"  - 半透明像素（已清理）: {semi_transparent_count}")
    print(f"  - 不透明像素: {opaque_count}")
    print(f"  - 输出: {output_path}")
    print()

# 处理吊线纹理
cable_path = 'assets/sprites/dom/cable.png'
if os.path.exists(cable_path):
    # 备份原始文件
    backup_path = cable_path.replace('.png', '_backup.png')
    if not os.path.exists(backup_path):
        Image.open(cable_path).save(backup_path)
        print(f"已备份原始文件: {backup_path}\n")

    # 清理纹理
    clean_texture_alpha(cable_path, cable_path, alpha_threshold=230)
else:
    print(f"文件不存在: {cable_path}")

# 处理所有楼层纹理
floor_textures = [
    'assets/sprites/dom/domlevel.png',
    'assets/sprites/dom/domlevel2.png',
    'assets/sprites/dom/domlevel3.png',
    'assets/sprites/dom/domlevel4.png',
    'assets/sprites/dom/domlevel5.png',
    'assets/sprites/dom/domlevel6.png'
]

for texture_path in floor_textures:
    if os.path.exists(texture_path):
        # 备份原始文件
        backup_path = texture_path.replace('.png', '_backup.png')
        if not os.path.exists(backup_path):
            Image.open(texture_path).save(backup_path)

        # 清理纹理
        clean_texture_alpha(texture_path, texture_path, alpha_threshold=230)
    else:
        print(f"文件不存在: {texture_path}")

print("\n所有纹理处理完成！")
print("原始文件已备份为 *_backup.png")
print("如果需要恢复，可以将备份文件重命名回原文件名")
