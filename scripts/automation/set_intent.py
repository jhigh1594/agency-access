#!/usr/bin/env python3
"""
Session Intent Helper

Quick way to set your session intent from the command line.
Usage: python3 set_intent.py "Working on memory system enhancements"

The intent file is automatically created by session-start.sh,
but you can use this script to update it during your session.
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="Set session intent for memory tracking",
        epilog="Example: python3 set_intent.py 'Working on memory system enhancements'"
    )
    parser.add_argument("intent", nargs="?", help="Session intent/description")
    parser.add_argument("--context", "-c", help="Additional context for the session")
    parser.add_argument("--show", "-s", action="store_true", help="Show current intent")
    parser.add_argument("--clear", action="store_true", help="Clear current intent")
    parser.add_argument("--workspace", type=Path, default=Path.cwd(), help="Workspace root")

    args = parser.parse_args()

    intent_file = args.workspace / ".aipmos" / "session-intent.json"

    # Show mode
    if args.show:
        if intent_file.exists():
            with open(intent_file, 'r') as f:
                data = json.load(f)
            print("Current Session Intent:")
            print(f"  Session ID: {data.get('session_id', 'N/A')}")
            print(f"  Started: {data.get('start_time', 'N/A')}")
            print(f"  Intent: {data.get('intent', '(not set)')}")
            if data.get('user_description'):
                print(f"  Context: {data.get('user_description')}")
        else:
            print("No session intent file found. Session may not have started yet.")
        return 0

    # Clear mode
    if args.clear:
        if intent_file.exists():
            data = json.loads(intent_file.read_text())
            data['intent'] = ''
            data['user_description'] = ''
            intent_file.write_text(json.dumps(data, indent=2))
            print("✅ Session intent cleared")
        else:
            print("ℹ️  No session intent file found")
        return 0

    # Set intent mode
    if not args.intent:
        parser.print_help()
        return 1

    # Load or create intent data
    if intent_file.exists():
        data = json.loads(intent_file.read_text())
    else:
        data = {
            "session_id": f"{int(datetime.now().timestamp())}",
            "start_time": datetime.now().isoformat() + "Z",
        }

    # Update intent
    data['intent'] = args.intent
    if args.context:
        data['user_description'] = args.context

    # Write back
    intent_file.parent.mkdir(parents=True, exist_ok=True)
    intent_file.write_text(json.dumps(data, indent=2))

    print(f"✅ Session intent set: {args.intent[:60]}{'...' if len(args.intent) > 60 else ''}")
    print(f"   This will be used to generate memory summary at session end.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
