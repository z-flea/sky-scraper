#!/usr/bin/env python3
"""
测试游戏物理效果：楼层掉落和摄像机抖动
"""

from playwright.sync_api import sync_playwright
import time

def test_game_physics():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 使用可见模式以便观察
        page = browser.new_page()

        print("正在加载游戏...")
        page.goto('http://localhost:5175')
        page.wait_for_load_state('networkidle')
        time.sleep(2)  # 等待游戏初始化

        print("\n=== 测试 1: 正常放置楼层（观察晃动效果） ===")
        print("放置几个 Okay 判定的楼层，观察摄像机抖动...")

        # 放置 5 个楼层，让它们有一定偏移以累积不稳定性
        for i in range(5):
            # 等待机械臂摆动到一定位置（不是中心）
            time.sleep(1.5)
            page.click('#game-canvas')
            print(f"放置第 {i+1} 层楼层")
            time.sleep(0.5)

        print("\n观察摄像机是否有抖动效果...")
        time.sleep(3)

        # 截图保存当前状态
        page.screenshot(path='/tmp/game_with_shake.png', full_page=True)
        print("已保存截图: /tmp/game_with_shake.png")

        print("\n=== 测试 2: Miss 判定（楼层掉落效果） ===")
        print("等待机械臂摆动到极端位置，触发 Miss 判定...")

        # 等待机械臂摆动到最边缘
        time.sleep(2.5)

        # 点击释放楼层
        page.click('#game-canvas')
        print("释放楼层，应该触发 Miss 判定...")

        # 等待楼层掉落动画
        time.sleep(2)

        # 检查是否显示游戏结束界面
        game_over = page.locator('#game-over-overlay.show')
        if game_over.is_visible():
            print("✅ 游戏结束界面已显示")

            # 读取最终分数和楼层数
            final_score = page.locator('#final-score').text_content()
            final_floors = page.locator('#final-floors').text_content()
            print(f"最终分数: {final_score}")
            print(f"建造楼层: {final_floors}")

            # 截图保存游戏结束状态
            page.screenshot(path='/tmp/game_over.png', full_page=True)
            print("已保存截图: /tmp/game_over.png")
        else:
            print("❌ 游戏结束界面未显示")

        # 检查控制台日志
        print("\n=== 控制台日志 ===")
        console_messages = []

        def handle_console(msg):
            console_messages.append(f"[{msg.type}] {msg.text}")

        page.on('console', handle_console)

        # 等待一下以收集日志
        time.sleep(1)

        # 打印最近的日志
        for msg in console_messages[-10:]:
            print(msg)

        print("\n测试完成！按 Enter 关闭浏览器...")
        input()

        browser.close()

if __name__ == '__main__':
    test_game_physics()
