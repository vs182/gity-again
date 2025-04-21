# app.py - Flask Backend
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
import base64
import tempfile
import shutil
import subprocess
import re
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='build')
CORS(app)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDrcwmqVLK7VKLDp3hQlfnCc8PWRwOr4NA")  # Use your own API key in production
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

# Store repository data in memory
repo_cache = {}

def clone_repo(repo_url):
    """Clone a GitHub repository to a temporary directory."""
    temp_dir = tempfile.mkdtemp()
    try:
        process = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, temp_dir],
            check=True, capture_output=True, text=True
        )
        return temp_dir
    except subprocess.CalledProcessError as e:
        shutil.rmtree(temp_dir)
        raise Exception(f"Failed to clone repository: {e.stderr}")

def analyze_repo(repo_path):
    """Analyze the repository structure and extract important information."""
    result = {
        "files": [],
        "file_contents": {},
        "structure": {},
        "languages": {},
        "summary": ""
    }
    
    # Skip these directories and file types
    skip_dirs = ['.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build']
    skip_extensions = ['.pyc', '.jar', '.class', '.so', '.dll', '.exe', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico']
    
    # Get repository structure
    files_by_ext = {}
    
    for root, dirs, files in os.walk(repo_path):
        # Skip directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        
        for file in files:
            if any(file.endswith(ext) for ext in skip_extensions):
                continue
                
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, repo_path)
            
            # Skip large files
            if os.path.getsize(file_path) > 1_000_000:  # 1MB limit
                continue
                
            # Add to files list
            result["files"].append(rel_path)
            
            # Track file extensions for language stats
            _, ext = os.path.splitext(file)
            if ext:
                if ext not in files_by_ext:
                    files_by_ext[ext] = 0
                files_by_ext[ext] += 1
            
            # Read file content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    result["file_contents"][rel_path] = content
            except:
                # Skip files that can't be read as text
                pass
    
    # Build directory structure
    structure = {}
    for file_path in result["files"]:
        parts = file_path.split(os.sep)
        current = structure
        for i, part in enumerate(parts):
            if i == len(parts) - 1:  # Last part (file)
                if "files" not in current:
                    current["files"] = []
                current["files"].append(part)
            else:  # Directory
                if "dirs" not in current:
                    current["dirs"] = {}
                if part not in current["dirs"]:
                    current["dirs"][part] = {}
                current = current["dirs"][part]
    
    result["structure"] = structure
    
    # Map file extensions to languages
    ext_to_lang = {
        '.py': 'Python',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript (React)',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript (React)',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.json': 'JSON',
        '.md': 'Markdown',
        '.yaml': 'YAML',
        '.yml': 'YAML',
        '.sh': 'Shell',
        '.java': 'Java',
        '.c': 'C',
        '.cpp': 'C++',
        '.go': 'Go',
        '.rb': 'Ruby',
        '.php': 'PHP',
    }
    
    for ext, count in files_by_ext.items():
        lang = ext_to_lang.get(ext, f'Unknown ({ext})')
        if lang not in result["languages"]:
            result["languages"][lang] = 0
        result["languages"][lang] += count
    
    # Generate repository summary using Gemini
    readme_content = ""
    for file in result["files"]:
        if file.lower() == 'readme.md':
            readme_content = result["file_contents"][file]
            break
    
    # Create a summary of the repository
    repo_info = {
        "total_files": len(result["files"]),
        "languages": result["languages"],
        "has_readme": bool(readme_content),
        "readme_sample": readme_content[:500] + "..." if len(readme_content) > 500 else readme_content,
        "key_files": [f for f in result["files"] if f in ["package.json", "requirements.txt", "setup.py", "Dockerfile", ".env.example", "config.py"]]
    }
    
    result["repo_info"] = repo_info
    return result

def query_gemini(prompt):
    """Send a query to the Gemini AI API."""
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    repo_url = data.get('repo_url')
    
    if not repo_url:
        return jsonify({"error": "No repository URL provided"}), 400
    
    # Check if this repo has already been analyzed
    if repo_url in repo_cache:
        return jsonify({"message": "Repository loaded from cache", "data": repo_cache[repo_url]}), 200
    
    try:
        # Clone the repository
        repo_path = clone_repo(repo_url)
        
        # Analyze the repository
        analysis = analyze_repo(repo_path)
        
        # Generate an initial summary with Gemini
        key_files = analysis["repo_info"]["key_files"]
        file_contents = ""
        
        # Add contents of key files to the prompt
        for key_file in key_files[:3]:  # Limit to avoid token limits
            if key_file in analysis["file_contents"]:
                file_contents += f"\n\nFile: {key_file}\n```\n{analysis['file_contents'][key_file][:1000]}...\n```"
        
        prompt = f"""Analyze this GitHub repository and provide a summary:

Repository Statistics:
- Total Files: {analysis['repo_info']['total_files']}
- Languages: {analysis['repo_info']['languages']}

README Content:
{analysis['repo_info']['readme_sample']}

Key Files:{file_contents}

Provide a concise summary of what this repository is about, its main features, and technologies used. Format the response with markdown.
"""
        
        # Query Gemini for the repository summary
        gemini_response = query_gemini(prompt)
        
        if "error" in gemini_response:
            analysis["summary"] = "Failed to generate summary with AI."
        else:
            # Extract the summary from Gemini's response
            try:
                summary_text = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
                analysis["summary"] = summary_text
            except (KeyError, IndexError):
                analysis["summary"] = "Failed to parse AI summary response."
        
        # Store in cache
        repo_cache[repo_url] = {
            "repo_info": analysis["repo_info"],
            "structure": analysis["structure"],
            "summary": analysis["summary"],
            "languages": analysis["languages"],
            "files": analysis["files"],
        }
        
        # Clean up temporary directory
        shutil.rmtree(repo_path)
        
        return jsonify({"message": "Repository analyzed successfully", "data": repo_cache[repo_url]}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/query', methods=['POST'])
def query():
    data = request.json
    repo_url = data.get('repo_url')
    question = data.get('question')
    
    if not repo_url or not question:
        return jsonify({"error": "Repository URL and question are required"}), 400
    
    if repo_url not in repo_cache:
        return jsonify({"error": "Repository not analyzed yet. Please analyze first."}), 400
    
    # Prepare context for Gemini
    repo_data = repo_cache[repo_url]
    
    prompt = f"""You're answering questions about a GitHub repository with the following details:

Repository Summary:
{repo_data['summary']}

Repository Stats:
- Total Files: {repo_data['repo_info']['total_files']}
- Languages: {repo_data['languages']}

File Structure:
{json.dumps(repo_data['structure'], indent=2)[:1000]}...

Question: {question}

Answer the question specifically about this repository. Format your response with markdown.
"""
    
    # Query Gemini with the context and question
    gemini_response = query_gemini(prompt)
    
    if "error" in gemini_response:
        return jsonify({"error": "Failed to get response from AI"}), 500
    
    try:
        answer = gemini_response["candidates"][0]["content"]["parts"][0]["text"]
        return jsonify({"answer": answer}), 200
    except (KeyError, IndexError):
        return jsonify({"error": "Failed to parse AI response"}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)