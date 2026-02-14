#!/usr/bin/env python3
"""
测试楼层纹理切换
按数字键 1-6 跳到不同楼层段，截图验证纹理
"""

from playwright.sync_api import sync_playwright
import time

def test_floor_textures():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        print("导航到游戏页面...")
        page.goto('http://localhost:5179')

        print("等待游戏加载...")
        page.wait_for_load_state('networkidle')
        time.sleep(2)

        # 测试不同楼层段的纹理
        test_cases = [
            ('1', 5, 'Phase 1 (0-10层) - domlevel.png'),
            ('2', 20, 'Phase 2 (11-30层) - domlevel2.png'),
            ('3', 40, 'Phase 3 (31-50层) - domlevel3.png'),
            ('4', 65, 'Phase 4 (51-80层) - domlevel4.png'),
            ('5', 100, 'Phase 5 (81-120层) - domlevel5.png'),
            ('6', 125, 'Phase 6 (120层以上) - domlevel6.png')
        ]

        for key, target_floor, description in test_cases:
            print(f"\n测试 {description}")
            print(f"按键 {key} 跳到第 {target_floor} 层...")

            page.keyboard.press(key)
            time.sleep(1.5)

            # 截图保存
            screenshot_path = f'/tmp/floor_test_phase_{key}.png'
            page.screenshot(path=screenshot_path, full_page=False)
            print(f"截图已保存: {screenshot_path}")

            # 获取当前楼层数
            floor_count = page.locator('#floor-count').inner_text()
            print(f"当前显示: {floor_count}")

        print("\n所有测试完成！")
        print("截图已保存到 /tmp/ 目录")
        print("请查看截图验证纹理是否正确切换")

        time.sleep(2)
        browser.close()

if __name__ == '__main__':
    test_floor_textures()
