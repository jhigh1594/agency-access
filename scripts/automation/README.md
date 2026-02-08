# AIPMOS Automation Setup

## Quick Start

### 1. Set Up Environment Variables

Create a `.env` file in this directory:

```bash
cd "/Users/jhigh/Planview Work/scripts/automation"
cp .env.example .env
```

Then edit `.env` and add your API keys:

```bash
# Get your Google API key from: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=your_actual_api_key_here

# Get your Slack channel email: Channel Settings > Integrations > "Send emails to this channel"
SLACK_EMAIL=your-channel@your-workspace.slack.com

# Gmail SMTP settings (requires App Password if using 2FA)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password_here
```

### 2. Load Environment Variables

The scripts automatically load environment variables from the `.env` file using python-dotenv (already installed). No additional shell configuration needed!

### 3. Verify Setup

```bash
source venv/bin/activate

# Check if API key is set
echo $GOOGLE_API_KEY

# Test weekly review
cd weekly_review
python weekly_review.py --skip-slack
```

## Available Automations

### Weekly Review
```bash
cd weekly_review
python weekly_review.py              # Run with Slack delivery
python weekly_review.py --skip-slack # Console output only
```

### Learning Capture
```bash
cd learning_capture
python learning_capture.py --mode send                    # Send prompt to Slack
python learning_capture.py --mode capture --response "..." # Capture learning
```

## Configuration

Each automation has a `config.yaml` file:
- `weekly_review/config.yaml` - Memory bank paths, AI settings, Slack config
- `learning_capture/config.yaml` - Prompt categories, storage settings

## Running Tests

```bash
source venv/bin/activate
python -m pytest tests/ -v
```

## Getting API Keys & Credentials

### Google Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to `.env` file as `GOOGLE_API_KEY`

### Slack Channel Email
1. Open your Slack channel
2. Click channel name → Settings → Integrations
3. Find "Send emails to this channel"
4. Click "Get email address"
5. Copy the email (format: `random-name@your-workspace.slack.com`)
6. Add to `.env` file as `SLACK_EMAIL`

### Gmail SMTP Credentials (for sending)
1. **If using 2-Factor Authentication (recommended):**
   - Go to https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (custom name)" → enter "AIPMOS Automation"
   - Click "Generate"
   - Copy the 16-character password
   - Use this as `SMTP_PASSWORD` in `.env`

2. **If NOT using 2FA:**
   - Use your regular Gmail password as `SMTP_PASSWORD`
   - Note: Less secure, not recommended

3. **Add to `.env`:**
   ```bash
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_app_password_here
   ```
