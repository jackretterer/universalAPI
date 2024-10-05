import argparse
import json
import asyncio
import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

async def worker(actions):
    # Initialize the headless browser
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run in headless mode
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    # Use ChromeDriverManager to get the appropriate ChromeDriver
    service = Service(ChromeDriverManager().install())

    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Set window size
    width, height = 1024, 768  # Default size
    driver.set_window_size(width, height)
    print(f"Window size set to {width}x{height}")

    # Record start time
    start_time = time.time()
    
    # Process each action
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
            click_element(driver, selector)
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

def click_element(driver, selector):
    try:
        element = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
        )
        element.click()
        print(f"Clicked on element: {selector}")
    except TimeoutException:
        print(f"Element not clickable: {selector}")
    except Exception as e:
        print(f"Error clicking element {selector}: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--params', type=str, help='Params for worker')

    args = parser.parse_args()

    if not args.params:
        print("No parameters provided to worker.")
        sys.exit(1)

    # Parse the parameters
    try:
        actions = json.loads(args.params)
    except json.JSONDecodeError as e:
        print(f"Error decoding parameters: {e}")
        sys.exit(1)

    # Run the worker asynchronously
    asyncio.run(worker(actions))