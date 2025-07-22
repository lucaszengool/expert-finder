# backend/app/services/email_service.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
import aiosmtplib
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import asyncio
from datetime import datetime
import re

class EmailService:
    """Service for sending and managing emails"""
    
    def __init__(self):
        # Email provider configuration
        self.provider = os.getenv("EMAIL_PROVIDER", "sendgrid")  # sendgrid, smtp, gmail
        
        # SendGrid configuration
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_client = SendGridAPIClient(self.sendgrid_api_key) if self.sendgrid_api_key else None
        
        # SMTP configuration
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        
        # Default sender
        self.default_from_email = os.getenv("DEFAULT_FROM_EMAIL", "noreply@yourcompany.com")
        self.default_from_name = os.getenv("DEFAULT_FROM_NAME", "Your Company")
        
        # Email tracking pixel base URL
        self.tracking_base_url = os.getenv("TRACKING_BASE_URL", "https://yourapp.com/api/track")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        content: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        campaign_id: Optional[str] = None,
        email_id: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        track_opens: bool = True,
        track_clicks: bool = True
    ) -> Dict[str, Any]:
        """Send an email using the configured provider"""
        
        # Add tracking if enabled
        if track_opens and email_id:
            content = self._add_tracking_pixel(content, email_id)
        
        if track_clicks and email_id:
            content = self._add_click_tracking(content, email_id)
        
        # Convert to HTML if needed
        html_content = self._convert_to_html(content)
        
        # Send based on provider
        if self.provider == "sendgrid" and self.sendgrid_client:
            return await self._send_via_sendgrid(
                to_email, subject, html_content, 
                from_email, from_name, cc, bcc, attachments,
                campaign_id, email_id
            )
        else:
            return await self._send_via_smtp(
                to_email, subject, html_content,
                from_email, from_name, cc, bcc, attachments
            )
    
    async def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str],
        from_name: Optional[str],
        cc: Optional[List[str]],
        bcc: Optional[List[str]],
        attachments: Optional[List[Dict[str, Any]]],
        campaign_id: Optional[str],
        email_id: Optional[str]
    ) -> Dict[str, Any]:
        """Send email via SendGrid"""
        
        message = Mail(
            from_email=(from_email or self.default_from_email, from_name or self.default_from_name),
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        # Add CC recipients
        if cc:
            for cc_email in cc:
                message.add_cc(cc_email)
        
        # Add BCC recipients
        if bcc:
            for bcc_email in bcc:
                message.add_bcc(bcc_email)
        
        # Add custom args for tracking
        if campaign_id:
            message.add_custom_arg("campaign_id", campaign_id)
        if email_id:
            message.add_custom_arg("email_id", email_id)
        
        # Add attachments
        if attachments:
            for attachment in attachments:
                # attachment should have: filename, content, content_type
                message.add_attachment(
                    attachment.get('content'),
                    attachment.get('filename'),
                    attachment.get('content_type', 'application/octet-stream')
                )
        
        try:
            response = self.sendgrid_client.send(message)
            return {
                "success": True,
                "message_id": response.headers.get('X-Message-Id'),
                "status_code": response.status_code
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str],
        from_name: Optional[str],
        cc: Optional[List[str]],
        bcc: Optional[List[str]],
        attachments: Optional[List[Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Send email via SMTP"""
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{from_name or self.default_from_name} <{from_email or self.default_from_email}>"
        msg['To'] = to_email
        
        if cc:
            msg['Cc'] = ', '.join(cc)
        
        # Add HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Recipients list
        recipients = [to_email]
        if cc:
            recipients.extend(cc)
        if bcc:
            recipients.extend(bcc)
        
        try:
            # Send via async SMTP
            async with aiosmtplib.SMTP(
                hostname=self.smtp_host,
                port=self.smtp_port,
                use_tls=self.smtp_use_tls
            ) as smtp:
                await smtp.login(self.smtp_username, self.smtp_password)
                await smtp.send_message(msg, recipients=recipients)
            
            return {
                "success": True,
                "message_id": msg['Message-ID']
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _convert_to_html(self, content: str) -> str:
        """Convert plain text to HTML if needed"""
        
        # Check if already HTML
        if '<html>' in content.lower() or '<body>' in content.lower():
            return content
        
        # Convert plain text to HTML
        lines = content.split('\n')
        html_lines = []
        
        for line in lines:
            if line.strip():
                # Convert URLs to links
                line = re.sub(
                    r'(https?://[^\s]+)',
                    r'<a href="\1">\1</a>',
                    line
                )
                html_lines.append(f'<p>{line}</p>')
            else:
                html_lines.append('<br>')
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                p {{
                    margin-bottom: 10px;
                }}
                a {{
                    color: #0066cc;
                    text-decoration: none;
                }}
                a:hover {{
                    text-decoration: underline;
                }}
            </style>
        </head>
        <body>
            {''.join(html_lines)}
        </body>
        </html>
        """
        
        return html_content
    
    def _add_tracking_pixel(self, content: str, email_id: str) -> str:
        """Add an invisible tracking pixel for open tracking"""
        
        tracking_url = f"{self.tracking_base_url}/open/{email_id}"
        pixel = f'<img src="{tracking_url}" width="1" height="1" style="display:none;" />'
        
        # Add before closing body tag
        if '</body>' in content:
            content = content.replace('</body>', f'{pixel}</body>')
        else:
            content += pixel
        
        return content
    
    def _add_click_tracking(self, content: str, email_id: str) -> str:
        """Add click tracking to links"""
        
        def replace_link(match):
            original_url = match.group(1)
            # Don't track unsubscribe links
            if 'unsubscribe' in original_url.lower():
                return match.group(0)
            
            tracked_url = f"{self.tracking_base_url}/click/{email_id}?url={original_url}"
            return f'href="{tracked_url}"'
        
        # Replace all href attributes
        content = re.sub(r'href="([^"]+)"', replace_link, content)
        
        return content
    
    async def send_bulk_emails(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        template: str,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        campaign_id: Optional[str] = None,
        delay_seconds: int = 1
    ) -> Dict[str, Any]:
        """Send bulk personalized emails"""
        
        results = {
            "sent": 0,
            "failed": 0,
            "errors": []
        }
        
        for recipient in recipients:
            try:
                # Personalize content
                personalized_content = self._personalize_template(
                    template,
                    recipient.get('personalization_data', {})
                )
                
                # Send email
                result = await self.send_email(
                    to_email=recipient['email'],
                    subject=self._personalize_template(subject, recipient.get('personalization_data', {})),
                    content=personalized_content,
                    from_email=from_email,
                    from_name=from_name,
                    campaign_id=campaign_id,
                    email_id=recipient.get('email_id')
                )
                
                if result['success']:
                    results['sent'] += 1
                else:
                    results['failed'] += 1
                    results['errors'].append({
                        'email': recipient['email'],
                        'error': result.get('error')
                    })
                
                # Delay between emails
                if delay_seconds > 0:
                    await asyncio.sleep(delay_seconds)
                    
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'email': recipient['email'],
                    'error': str(e)
                })
        
        return results
    
    def _personalize_template(self, template: str, data: Dict[str, Any]) -> str:
        """Replace template variables with personalized data"""
        
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            template = template.replace(placeholder, str(value))
        
        # Remove any remaining placeholders
        template = re.sub(r'\{[^}]+\}', '', template)
        
        return template
    
    async def verify_email_address(self, email: str) -> Dict[str, Any]:
        """Verify if an email address is valid and deliverable"""
        
        # Basic regex validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return {
                "valid": False,
                "reason": "Invalid email format"
            }
        
        # In production, you would use an email verification service like:
        # - SendGrid Email Validation API
        # - ZeroBounce
        # - NeverBounce
        # - Hunter.io
        
        # For now, return basic validation
        return {
            "valid": True,
            "deliverable": True,
            "risk_score": 0.1
        }
    
    async def get_email_status(self, email_id: str) -> Dict[str, Any]:
        """Get the status of a sent email"""
        
        # This would integrate with your email provider's webhook data
        # or API to get real-time status
        
        # Mock response for now
        return {
            "email_id": email_id,
            "status": "delivered",
            "sent_at": datetime.utcnow().isoformat(),
            "delivered_at": datetime.utcnow().isoformat(),
            "opened": True,
            "opened_at": datetime.utcnow().isoformat(),
            "clicked": False,
            "bounced": False,
            "complained": False
        }

# Singleton instance
email_service = EmailService()