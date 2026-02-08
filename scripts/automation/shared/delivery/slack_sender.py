"""
Slack delivery for automation workflows.

Sends formatted messages to Slack via email (SMTP).
"""

import logging
import asyncio
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

logger = logging.getLogger(__name__)


class SlackSender:
    """Sends messages to Slack via email."""

    def __init__(self):
        """Initialize Slack sender."""
        self.slack_email = os.getenv("SLACK_EMAIL")
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")

        self.max_retries = 2
        self.retry_delay = 30  # seconds

        if not self.slack_email:
            logger.warning("SLACK_EMAIL not set - Slack delivery disabled")
            self.configured = False
        elif not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP credentials not set - Slack delivery disabled")
            self.configured = False
        else:
            self.configured = True
            logger.info(f"Slack email delivery configured to {self.slack_email}")

    async def send_blocks(
        self,
        blocks: List[dict],
        text: str = "",
        retry: int = 0
    ) -> bool:
        """
        Send blocks to Slack via email with retry logic.

        Converts Slack block format to HTML email.

        Args:
            blocks: List of Slack block dicts (converted to HTML)
            text: Email subject line
            retry: Current retry attempt number

        Returns:
            True if successful, False otherwise
        """
        if not self.configured:
            logger.error("Slack not configured - cannot send")
            return False

        try:
            # Convert blocks to HTML
            html_body = self._blocks_to_html(blocks)
            subject = text if text else "AIPMOS Automation Update"

            # DEBUG: Log the HTML being sent
            logger.info(f"DEBUG - HTML BODY:\n{html_body}\n---END HTML---")

            # Send email via SMTP
            logger.info(f"Sending email to {self.slack_email}...")
            success = await self._send_email(subject, html_body)

            if success:
                logger.info("Email sent successfully to Slack")
                return True
            else:
                if retry < self.max_retries:
                    logger.info(
                        f"Retrying in {self.retry_delay} seconds "
                        f"(attempt {retry + 1}/{self.max_retries})"
                    )
                    await asyncio.sleep(self.retry_delay)
                    return await self.send_blocks(blocks, text, retry + 1)
                return False

        except Exception as e:
            logger.error(f"Error sending email to Slack: {e}")
            if retry < self.max_retries:
                logger.info(
                    f"Retrying in {self.retry_delay} seconds "
                    f"(attempt {retry + 1}/{self.max_retries})"
                )
                await asyncio.sleep(self.retry_delay)
                return await self.send_blocks(blocks, text, retry + 1)
            return False

    async def _send_email(self, subject: str, html_body: str) -> bool:
        """
        Send HTML email via SMTP.

        Args:
            subject: Email subject
            html_body: HTML content

        Returns:
            True if successful, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.smtp_user
            msg["To"] = self.slack_email

            # Attach HTML body
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)

            # Send via SMTP in executor to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                self._send_smtp,
                msg
            )
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    def _send_smtp(self, msg: MIMEMultipart) -> None:
        """Send email via SMTP (blocking operation)."""
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)

    def _blocks_to_html(self, blocks: List[dict]) -> str:
        """
        Convert Slack blocks to HTML email format.

        Args:
            blocks: List of Slack block dicts

        Returns:
            HTML string
        """
        html_parts = [
            '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">'
        ]

        for block in blocks:
            block_type = block.get("type", "")

            if block_type == "header":
                text = block.get("text", {}).get("text", "")
                html_parts.append(
                    f'<h1 style="font-size: 24px; font-weight: 700; margin: 20px 0 10px 0; color: #1d1c1d;">{text}</h1>'
                )

            elif block_type == "section":
                text = block.get("text", {}).get("text", "")
                # Convert markdown to HTML (basic)
                text = self._markdown_to_html(text)
                html_parts.append(
                    f'<div style="margin: 12px 0; line-height: 1.5; color: #1d1c1d;">{text}</div>'
                )

            elif block_type == "divider":
                html_parts.append(
                    '<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;">'
                )

        html_parts.append('</div>')
        return ''.join(html_parts)

    def _markdown_to_html(self, text: str) -> str:
        """
        Convert basic Slack markdown to HTML.

        Handles: **bold**, *italic*, `code`, bullet lists

        Args:
            text: Slack markdown text

        Returns:
            HTML string
        """
        import re
        import html

        # Preserve Slack-style links before escaping.
        link_tokens = []

        def _stash_link(match):
            link_tokens.append((match.group(1), match.group(2)))
            return f"__SLACK_LINK_{len(link_tokens) - 1}__"

        text = re.sub(r'<([^>|]+)\|([^>]+)>', _stash_link, text)

        # Escape HTML to prevent accidental tag stripping.
        text = html.escape(text)

        # Restore Slack links as HTML anchors.
        for idx, (url, label) in enumerate(link_tokens):
            anchor = f'<a href="{html.escape(url)}">{html.escape(label)}</a>'
            text = text.replace(f"__SLACK_LINK_{idx}__", anchor)

        # Bold: **text** (process first)
        text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)

        # Bold: *text* (only match within single lines, not across newlines)
        text = re.sub(r'\*([^\n*]+?)\*', r'<strong>\1</strong>', text)

        # Code: `text`
        text = re.sub(
            r'`(.+?)`',
            r'<code style="background: #f5f5f5; padding: 2px 4px; border-radius: 3px; font-family: Monaco, monospace;">\1</code>',
            text
        )

        # Convert bullet points (lines starting with - or *)
        lines = text.split('\n')
        in_list = False
        html_lines = []

        for line in lines:
            line = line.strip()
            # Handle both - and * as bullet markers
            if line.startswith('- ') or line.startswith('* '):
                if not in_list:
                    html_lines.append('<ul style="margin: 8px 0; padding-left: 24px;">')
                    in_list = True
                # Remove bullet marker (first 2 characters: "- " or "* ")
                bullet_content = line[2:].strip()
                html_lines.append(f'<li style="margin: 4px 0;">{bullet_content}</li>')
            else:
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                if line:
                    html_lines.append(f'<p style="margin: 8px 0;">{line}</p>')

        if in_list:
            html_lines.append('</ul>')

        return ''.join(html_lines)
