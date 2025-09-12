#!/usr/bin/env python3
"""
Simple proxy blocker that logs to a shared JSON file and reads dynamic blocklist
"""
from mitmproxy import http
from pathlib import Path
import json
import time
from datetime import datetime
import threading
import os

# Dynamic blocklist file
BLOCKLIST_FILE = Path(__file__).parent / "blocklist.json"
HIGH_RISK_FILE = Path(__file__).parent / "high_risk_domains.json"
# Default blocked sites (fallback)
DEFAULT_BLOCKED = ["facebook.com", "twitter.com", "instagram.com", "reddit.com", "youtube.com", "tiktok.com"]
LOG_FILE = Path("/tmp/proxy_activity.json")
LOG_LOCK = threading.Lock()

# Cache for blocklist (reload periodically)
blocklist_cache = []
blocklist_cache_time = 0
high_risk_cache = []
high_risk_cache_time = 0

def load_blocklist():
    """Load blocklist from JSON file with caching"""
    global blocklist_cache, blocklist_cache_time
    
    # Reload every 5 seconds for real-time updates
    if time.time() - blocklist_cache_time > 5:
        try:
            if BLOCKLIST_FILE.exists():
                with open(BLOCKLIST_FILE, 'r') as f:
                    blocklist_cache = json.load(f)
                    blocklist_cache_time = time.time()
                    print(f"📋 Loaded {len(blocklist_cache)} blocking rules")
            else:
                # Use default if file doesn't exist
                blocklist_cache = [{"domain": d, "methods": ["GET", "POST"]} for d in DEFAULT_BLOCKED]
        except Exception as e:
            print(f"⚠️ Error loading blocklist: {e}")
            if not blocklist_cache:  # If cache is empty, use defaults
                blocklist_cache = [{"domain": d, "methods": ["GET", "POST"]} for d in DEFAULT_BLOCKED]
    
    return blocklist_cache

def load_high_risk_domains():
    """Load high-risk domains from separate JSON file"""
    global high_risk_cache, high_risk_cache_time
    
    # Reload every 5 seconds for real-time updates
    if time.time() - high_risk_cache_time > 5:
        try:
            if HIGH_RISK_FILE.exists():
                with open(HIGH_RISK_FILE, 'r') as f:
                    high_risk_cache = json.load(f)
                    high_risk_cache_time = time.time()
                    print(f"🚨 Loaded {len(high_risk_cache)} high-risk domain rules")
            else:
                high_risk_cache = []
        except Exception as e:
            print(f"⚠️ Error loading high-risk domains: {e}")
            if not high_risk_cache:
                high_risk_cache = []
    
    return high_risk_cache

# Load the custom HTML templates
html_path = Path(__file__).parent / "templates" / "blocked.html"
risk_analysis_path = Path(__file__).parent / "templates" / "risk_analysis.html"

if html_path.exists():
    with open(html_path, 'r') as f:
        HTML_TEMPLATE = f.read()
    print(f"✅ Loaded custom blocked.html ({len(HTML_TEMPLATE)} bytes)")
else:
    print("⚠️  Using fallback HTML template")
    HTML_TEMPLATE = """
    <html>
    <body style="background:#2c3e50;color:white;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:system-ui;">
        <div style="text-align:center;padding:60px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:20px;">
            <h1 style="font-size:80px;margin:0;">🛑 BLOCKED</h1>
            <h2>{{DOMAIN}}</h2>
            <p>This site is not allowed</p>
        </div>
    </body>
    </html>
    """

# Load risk analysis template for special domains
if risk_analysis_path.exists():
    with open(risk_analysis_path, 'r') as f:
        RISK_ANALYSIS_TEMPLATE = f.read()
    print(f"✅ Loaded risk_analysis.html for high-risk domains")
else:
    RISK_ANALYSIS_TEMPLATE = None

def log_to_file(domain, path="/", method="GET", blocked=False, status="200", response_time=0):
    """Log activity to JSON file"""
    try:
        with LOG_LOCK:
            # Read existing logs
            logs = []
            if LOG_FILE.exists():
                try:
                    with open(LOG_FILE, 'r') as f:
                        logs = json.load(f)
                except:
                    logs = []
            
            # Add new log
            logs.append({
                'timestamp': datetime.now().isoformat(),
                'domain': domain,
                'path': path,
                'method': method,
                'blocked': blocked,
                'status': status,
                'response_time': response_time
            })
            
            # Keep only last 1000 entries
            logs = logs[-1000:]
            
            # Write back
            with open(LOG_FILE, 'w') as f:
                json.dump(logs, f)
                
    except Exception as e:
        print(f"⚠️ Logging failed: {e}")

def request(flow: http.HTTPFlow) -> None:
    host = flow.request.pretty_host.lower()
    path = flow.request.path
    method = flow.request.method
    start_time = time.time()
    
    # Skip localhost and dashboard
    if "localhost" in host or "127.0.0.1" in host:
        return
    
    # Load current blocklist and high-risk domains
    blocklist = load_blocklist()
    high_risk_domains = load_high_risk_domains()
    
    # First check if it's a high-risk domain
    is_high_risk = False
    high_risk_rule = None
    for rule in high_risk_domains:
        if rule['domain'] in host:
            # Check if this method is blocked
            if method in rule.get('methods', ['GET', 'POST']):
                is_high_risk = True
                high_risk_rule = rule
                break
    
    # Then check regular blocklist
    blocked = False
    for rule in blocklist:
        if rule['domain'] in host:
            # Check if this method is blocked
            if method in rule.get('methods', ['GET', 'POST']):
                blocked = True
                break
    
    # Handle high-risk domains with special animation
    if is_high_risk:
        if RISK_ANALYSIS_TEMPLATE:
            # Use the animated risk analysis template for high-risk domains
            html = RISK_ANALYSIS_TEMPLATE.replace("{{DOMAIN}}", host)
            print(f"🚨 High-Risk Domain Blocked: {host} [{method}] - Showing risk analysis")
        else:
            # Fallback to standard block if template missing
            html = HTML_TEMPLATE.replace("{{DOMAIN}}", host)
            if high_risk_rule and 'message' in high_risk_rule:
                html = html.replace("</p>", f"</p><p style='font-size:14px;opacity:0.8;margin-top:20px;'>⚠️ {high_risk_rule['message']}</p>")
            print(f"🚨 High-Risk Domain Blocked: {host} [{method}]")
        
        flow.response = http.Response.make(
            200,
            html.encode('utf-8'),
            {"Content-Type": "text/html; charset=UTF-8"})
        
        # Log high-risk blocked request
        response_time = (time.time() - start_time) * 1000
        log_to_file(host, path, method, blocked=True, status="HIGH-RISK-BLOCKED", response_time=response_time)
    
    # Handle regular blocked domains
    elif blocked:
        # Use standard block page for regular blocked domains
        html = HTML_TEMPLATE.replace("{{DOMAIN}}", host)
        
        # Add reason if available
        for rule in blocklist:
            if rule['domain'] in host and 'reason' in rule:
                html = html.replace("</p>", f"</p><p style='font-size:14px;opacity:0.8;margin-top:20px;'>Reason: {rule['reason']}</p>")
                break
        
        print(f"🚫 Blocked: {host} [{method}]")
        
        flow.response = http.Response.make(
            200,
            html.encode('utf-8'),
            {"Content-Type": "text/html; charset=UTF-8"})
        
        # Log blocked request
        response_time = (time.time() - start_time) * 1000
        log_to_file(host, path, method, blocked=True, status="BLOCKED", response_time=response_time)
    
    else:
        # Log allowed request
        log_to_file(host, path, method, blocked=False, status="200", response_time=0)

def response(flow: http.HTTPFlow) -> None:
    """Log responses for allowed requests"""
    pass