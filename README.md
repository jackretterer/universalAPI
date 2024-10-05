# Web Recorder and Workflow Automation

This project consists of a Chrome extension for recording web interactions and a server-side component for executing automated workflows based on those recordings.

## Getting Started

### Prerequisites

- Python 3.7+
- Node.js and npm
- Google Chrome browser

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/jackretterer/universalAPI.git
   cd your-repo-name
   ```

2. Set up the server:
   ```
   cd server
   pip install -r requirements.txt
   ```

3. Start the local server:
   ```
   uvicorn main:app --reload
   ```

4. Install the Chrome Extension:
   - Open Google Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `web-recorder-extension` directory from this project

## Usage

### Recording a Workflow

1. Click on the Web Recorder extension icon in Chrome
2. Enter the API endpoint for your workflow
3. Click "Start Recording" and perform the actions you want to record
4. Click "Stop Recording" when finished

### Running a Workflow

To test the recorded workflows, use the following curl command:
    ```
    curl -X POST http://localhost:8000/uipi/run/<API_NAME>
    ```

Replace `<API_NAME>` with the endpoint you specified when recording the workflow.

## Project Structure

- `web-recorder-extension/`: Chrome extension for recording web interactions
- `server/`: FastAPI server for storing and executing workflows
  - `main.py`: Main server file
  - `worker.py`: Worker script for executing recorded workflows

