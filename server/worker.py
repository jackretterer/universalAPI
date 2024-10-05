import argparse
import json
import asyncio
import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

async def worker(params):
    # Initialize the headless browser
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run in headless mode
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    # Specify the path to chromedriver if not in PATH
    chromedriver_path = os.getenv('CHROMEDRIVER_PATH', 'chromedriver')

    driver = webdriver.Chrome(executable_path=chromedriver_path, options=chrome_options)
    
    # Set window size
    window_size = params.get('windowSize', {})
    width = window_size.get('width', 1024)
    height = window_size.get('height', 768)
    driver.set_window_size(width, height)
    print(f"Window size set to {width}x{height}")

    # Record start time
    start_time = time.time()
    
    # Process each action
    actions = params.get('actions', [])
    for action in actions:
        action_type = action.get('type')
        timestamp = action.get('timestamp', 0) / 1000  # Convert milliseconds to seconds
        
        # Synchronize timing
        elapsed_time = time.time() - start_time
        wait_time = timestamp - elapsed_time
        if wait_time > 0:
            await asyncio.sleep(wait_time)
        
        print(f"Executing action: {action_type} at {timestamp}s")
        
        if action_type == 'navigation':
            url = action.get('url')
            print(f"Navigating to {url}")
            driver.get(url)
        elif action_type == 'click':
            selector = action.get('selector')
            try:
                element = driver.find_element(By.CSS_SELECTOR, selector)
                element.click()
                print(f"Clicked on element: {selector}")
            except Exception as e:
                print(f"Error clicking element {selector}: {e}")
        elif action_type == 'input':
            selector = action.get('selector')
            value = action.get('value', '')
            try:
                element = driver.find_element(By.CSS_SELECTOR, selector)
                element.clear()
                element.send_keys(value)
                print(f"Entered '{value}' into {selector}")
            except Exception as e:
                print(f"Error inputting into {selector}: {e}")
        elif action_type == 'scroll':
            scroll_x = action.get('scrollX', 0)
            scroll_y = action.get('scrollY', 0)
            driver.execute_script(f"window.scrollTo({scroll_x}, {scroll_y});")
            print(f"Scrolled to ({scroll_x}, {scroll_y})")
        elif action_type == 'mousemove':
            # Mouse movement is typically not simulated in a headless browser
            print("Mouse movement action encountered (ignored in headless mode)")
        else:
            print(f"Unknown action type: {action_type}")

    # Close the browser
    driver.quit()
    print("Workflow execution completed.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--params', type=str, help='Params for worker')

    args = parser.parse_args()

    if not args.params:
        print("No parameters provided to worker.")
        sys.exit(1)

    # Parse the parameters
    try:
        params = json.loads(args.params)
    except json.JSONDecodeError as e:
        print(f"Error decoding parameters: {e}")
        sys.exit(1)

    # Run the worker asynchronously
    asyncio.run(worker(params))