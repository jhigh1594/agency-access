Execute the daily competitive intelligence briefing system.

## Command Arguments

Parse the command arguments in order:
1. **Mode** (optional, default: `standard`): `quick`, `standard`, or `deep`
   - `quick`: 12h lookback, max 3 insights, no scraping
   - `standard`: 24h lookback, max 5 insights, scraping enabled
   - `deep`: 48h lookback, max 10 insights, scraping + Perplexity research
2. **Delivery** (optional, default: `both`): `email`, `slack`, or `both`
3. **Skip Storage** (optional, default: `false`): `true` to skip historical storage (useful for testing)
4. **Dry Run** (optional, default: `false`): `true` to simulate delivery without actually sending (useful for testing)

## Execution

Run the daily brief using the bash script at `/Users/jhigh/Planview Work/scripts/daily-brief/run.sh` with the parsed arguments.

The script:
- Changes to the daily-brief directory
- Loads environment from `.env.daily-brief` if present
- Validates arguments
- Executes `daily_brief.py` with appropriate flags
- Uses config from `config.yaml` in the daily-brief directory

## Examples

- `/daily-brief` → `bash run.sh standard both`
- `/daily-brief quick` → `bash run.sh quick both`
- `/daily-brief standard email` → `bash run.sh standard email`
- `/daily-brief deep slack` → `bash run.sh deep slack`
- `/daily-brief standard both true` → `bash run.sh standard both true` (skips storage)
- `/daily-brief standard both false true` → `bash run.sh standard both false true` (dry run - no actual delivery)
- `/daily-brief quick email false true` → `bash run.sh quick email false true` (quick mode, email only, dry run)

## Output Summary

After execution completes, provide a summary including:

**Execution Details:**
- Execution time (in seconds)
- Mode used
- Delivery channels attempted

**Data Collection:**
- Total raw insights collected
- Insights analyzed (after filtering by significance ≥3.0, relevance ≥0.4)
- Insights included in final brief (top N based on mode)
- Number of urgent insights detected (if any)

**Brief Content:**
- Executive summary preview (first 100 chars)
- Number of trends identified
- Number of recommended actions

**Delivery Status:**
- Email: Success/failure status
- Slack: Success/failure status
- Any delivery errors encountered

**Issues/Warnings:**
- Any errors or warnings from the execution
- Configuration issues (e.g., missing Slack webhook URL)
- Runtime warnings (e.g., unawaited coroutines)

**Storage:**
- Whether brief was stored to historical storage (unless skipped)
- Number of old briefs cleaned up (if any)

## Dry Run Mode

When dry run is enabled (4th argument = `true`):
- **Full brief generation** still occurs (collection, analysis, synthesis)
- **No actual delivery** - email and Slack messages are simulated
- **Storage still occurs** (unless `skip_storage` is also `true`)
- **Logs show** what would have been sent (recipients, content preview, etc.)

Use dry run to:
- Test brief generation without sending emails/Slack messages
- Verify configuration without triggering actual deliveries
- Preview brief content before production runs
- Debug issues without spamming recipients

**Example:** `/daily-brief standard both false true` generates a full brief and shows what would be delivered, but doesn't actually send anything.

## Troubleshooting

### Common Issues and Solutions

#### 1. **Slack Delivery Fails**
**Symptom:** `Error sending Slack message: your_slack_webhook_url_here`

**Cause:** Slack webhook URL not configured or using placeholder value

**Solution:**
1. Check `.env.daily-brief` file in the daily-brief directory
2. Verify `SLACK_WEBHOOK_URL` is set (not the placeholder)
3. Get webhook URL from Slack: Settings → Apps → Incoming Webhooks → Add to Workspace
4. Format: `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`

**Quick test:** Run with `--dry-run` to see if webhook is configured without actually sending

---

#### 2. **Email Delivery Fails**
**Symptom:** `Email not configured - cannot send` or SMTP authentication errors

**Cause:** Missing or incorrect email configuration

**Solution:**
1. Check `.env.daily-brief` for required variables:
   - `SMTP_HOST` (default: smtp.gmail.com)
   - `SMTP_PORT` (default: 587)
   - `SMTP_USER` (your Gmail address)
   - `SMTP_PASSWORD` (Gmail app password, not regular password)
   - `EMAIL_TO` (recipient address)

2. For Gmail, create an app password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail" and use that in `SMTP_PASSWORD`

3. Test SMTP connection:
   ```bash
   cd scripts/daily-brief
   python -c "import smtplib; s = smtplib.SMTP('smtp.gmail.com', 587); s.starttls(); s.login('YOUR_EMAIL', 'APP_PASSWORD'); print('Success')"
   ```

---

#### 3. **No Insights Collected**
**Symptom:** `No insights collected` or `No insights passed filtering`

**Possible Causes:**
- NewsAPI key missing or invalid
- RSS feeds unreachable
- All insights filtered out by significance/relevance thresholds

**Solution:**
1. Check `.env.daily-brief` for `NEWSAPI_KEY`
2. Verify API key is valid: https://newsapi.org/account
3. Check logs for specific collection errors
4. Lower filtering thresholds in `config.yaml`:
   ```yaml
   ai:
     analysis:
       min_significance: 2.0  # Lower from 3.0
       min_relevance: 0.3      # Lower from 0.4
   ```

---

#### 4. **Python/Import Errors**
**Symptom:** `ModuleNotFoundError` or `No module named 'X'`

**Cause:** Missing dependencies or wrong Python environment

**Solution:**
1. Ensure virtual environment is activated:
   ```bash
   source /Users/jhigh/Planview\ Work/scripts/venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   cd scripts/daily-brief
   pip install -r requirements.txt
   ```

3. Verify Python version (should be 3.14):
   ```bash
   python --version
   ```

---

#### 5. **Config File Not Found**
**Symptom:** `Config file not found: config.yaml`

**Cause:** Script not running from correct directory or config file missing

**Solution:**
1. Verify `config.yaml` exists in `scripts/daily-brief/` directory
2. The `run.sh` script should handle directory changes automatically
3. If running Python directly, ensure you're in the daily-brief directory:
   ```bash
   cd /Users/jhigh/Planview\ Work/scripts/daily-brief
   python daily_brief.py --mode standard
   ```

---

#### 6. **API Rate Limits / Quota Exceeded**
**Symptom:** `429 Too Many Requests` or `Quota exceeded`

**Cause:** NewsAPI or Google Gemini API rate limits hit

**Solution:**
1. **NewsAPI:** Free tier is 100 requests/day
   - Check usage at https://newsapi.org/account
   - Consider upgrading or reducing frequency

2. **Google Gemini:** Check quota at https://makersuite.google.com/app/apikey
   - Free tier has generous limits but may vary
   - Monitor usage in Google Cloud Console

3. **Workaround:** Use `quick` mode to reduce API calls, or wait for quota reset

---

#### 7. **Brief Synthesis Fails**
**Symptom:** `Brief synthesis failed` or empty brief returned

**Cause:** Gemini API error, invalid prompt, or no insights to synthesize

**Solution:**
1. Check logs for specific Gemini API errors
2. Verify `GOOGLE_API_KEY` in `.env.daily-brief` is valid
3. Check if insights were collected (may be filtering issue)
4. Review `logs/daily_brief_YYYYMMDD.log` for detailed error messages

---

#### 8. **Storage Errors**
**Symptom:** `Storage failed` or permission errors

**Cause:** Missing `metrics/` directory or permission issues

**Solution:**
1. Create metrics directory:
   ```bash
   mkdir -p scripts/daily-brief/metrics
   ```

2. Check write permissions:
   ```bash
   touch scripts/daily-brief/metrics/test.txt && rm scripts/daily-brief/metrics/test.txt
   ```

3. Use `--skip-storage` to bypass if not critical

---

### Debugging Tips

1. **Check logs first:** Always review `logs/daily_brief_YYYYMMDD.log` for detailed error messages

2. **Use dry run for testing:** Test configuration without sending:
   ```bash
   /daily-brief standard both false true
   ```

3. **Test individual components:**
   - Test email: Check `.env.daily-brief` email config
   - Test Slack: Check webhook URL format
   - Test APIs: Verify API keys are valid

4. **Verify environment:**
   ```bash
   cd scripts/daily-brief
   source ../venv/bin/activate
   python -c "import os; from dotenv import load_dotenv; load_dotenv('.env.daily-brief'); print('NEWSAPI_KEY:', 'SET' if os.getenv('NEWSAPI_KEY') else 'MISSING')"
   ```

5. **Check recent changes:** Review `IMPLEMENTATION_COMPLETE.md` and `IMPROVEMENT_GUIDE.md` for recent updates that might affect behavior

---

## Notes

- The script uses Python from `/Users/jhigh/Planview Work/scripts/venv/bin/python`
- Environment variables are loaded from `.env.daily-brief` in the daily-brief directory
- Logs are written to `logs/daily_brief_YYYYMMDD.log`
- Metrics are stored in `metrics/` directory
- Historical briefs are stored as JSON in `metrics/daily_brief_YYYYMMDD.json`
- For production runs, ensure all environment variables are set before scheduling
