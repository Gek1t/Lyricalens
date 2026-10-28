import os
import sys
import time
import subprocess
import socket
import urllib.request
from playwright.sync_api import sync_playwright

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def wait_for_server(port, timeout=40):
    start = time.time()
    while time.time() - start < timeout:
        if is_port_open(port):
            try:
                urllib.request.urlopen(f'http://localhost:{port}/', timeout=1)
                return True
            except Exception:
                pass
        time.sleep(0.5)
    return False

def main():
    port = 3000
    if not is_port_open(port):
        print(f"Error: port {port} is not open")
        sys.exit(1)
    print(f"Server is actively listening on port {port}!")

    out_dir = r'C:\Users\21779\.gemini\antigravity\brain\5a671390-1683-4e51-8081-7edce7956657'
    phone_shot_path = os.path.join(out_dir, 'netease_phone_auth_modal.png')
    qr_shot_path = os.path.join(out_dir, 'netease_qr_auth_modal.png')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        print("Navigating to http://localhost:3000/...")
        page.goto('http://localhost:3000/', wait_until='networkidle')
        page.wait_for_timeout(2000)

        # Open Personal Hub via left header button on active panel
        print("Clicking #top-header-left-btn on active panel to open Personal Hub...")
        page.locator('#top-header-left-btn').nth(1).click()
        page.wait_for_timeout(1500)

        # Click "同步与设置" tab
        print("Clicking '同步与设置' tab...")
        page.evaluate("(() => { const b = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('同步与设置')); if (b) { b.click(); return true; } return false; })()")
        page.wait_for_timeout(1000)

        # Click "授权登录" button to open NetEase Auth modal
        print("Clicking '授权登录' button...")
        page.evaluate("(() => { const b = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('授权登录')); if (b) b.click(); })()")
        page.wait_for_timeout(1000)

        # Screenshot 1: Phone Auth Modal
        print("Capturing netease_phone_auth_modal.png...")
        page.screenshot(path=phone_shot_path, full_page=False)
        print(f"Saved phone auth modal to: {phone_shot_path}")

        # Switch to "扫码授权" tab
        print("Clicking '扫码授权' tab...")
        page.evaluate("(() => { const b = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('扫码授权')); if (b) b.click(); })()")
        page.wait_for_timeout(1500)

        # Screenshot 2: QR Auth Modal
        print("Capturing netease_qr_auth_modal.png...")
        page.screenshot(path=qr_shot_path, full_page=False)
        print(f"Saved qr auth modal to: {qr_shot_path}")

        browser.close()

    print("Playwright capture completed successfully!")

if __name__ == '__main__':
    main()
