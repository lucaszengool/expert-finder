# Social Media Integration Service
import asyncio
import aiohttp
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import hashlib
import hmac
from abc import ABC, abstractmethod

# Base connector class
class SocialMediaConnector(ABC):
    def __init__(self, credentials: Dict[str, Any]):
        self.credentials = credentials
        
    @abstractmethod
    async def send_message(self, recipient: str, message: str, media_urls: List[str] = None) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def validate_credentials(self) -> bool:
        pass
    
    @abstractmethod
    async def get_profile_info(self, profile_id: str) -> Dict[str, Any]:
        pass

# Instagram connector
class InstagramConnector(SocialMediaConnector):
    API_BASE = "https://graph.instagram.com/v18.0"
    
    async def validate_credentials(self) -> bool:
        """Validate Instagram/Facebook API credentials"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.API_BASE}/me"
                params = {"access_token": self.credentials.get("access_token")}
                async with session.get(url, params=params) as resp:
                    return resp.status == 200
        except:
            return False
    
    async def send_message(self, recipient: str, message: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Send Instagram Direct Message"""
        async with aiohttp.ClientSession() as session:
            # First, get the recipient's IG user ID
            user_id = await self._get_user_id(session, recipient)
            if not user_id:
                return {"success": False, "error": "User not found"}
            
            # Create message thread
            url = f"{self.API_BASE}/{self.credentials['page_id']}/messages"
            data = {
                "recipient": {"id": user_id},
                "message": {"text": message}
            }
            
            if media_urls:
                data["message"]["attachment"] = {
                    "type": "image",
                    "payload": {"url": media_urls[0]}
                }
            
            headers = {"Authorization": f"Bearer {self.credentials['access_token']}"}
            async with session.post(url, json=data, headers=headers) as resp:
                result = await resp.json()
                return {
                    "success": resp.status == 200,
                    "message_id": result.get("message_id"),
                    "error": result.get("error", {}).get("message") if resp.status != 200 else None
                }
    
    async def _get_user_id(self, session: aiohttp.ClientSession, username: str) -> Optional[str]:
        """Get Instagram user ID from username"""
        url = f"{self.API_BASE}/ig_user_search"
        params = {
            "user_name": username,
            "access_token": self.credentials["access_token"]
        }
        async with session.get(url, params=params) as resp:
            if resp.status == 200:
                data = await resp.json()
                users = data.get("data", [])
                return users[0]["id"] if users else None
        return None
    
    async def get_profile_info(self, profile_id: str) -> Dict[str, Any]:
        """Get Instagram profile information"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.API_BASE}/{profile_id}"
            params = {
                "fields": "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url",
                "access_token": self.credentials["access_token"]
            }
            async with session.get(url, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                return {}

# WhatsApp connector
class WhatsAppConnector(SocialMediaConnector):
    API_BASE = "https://graph.facebook.com/v18.0"
    
    async def validate_credentials(self) -> bool:
        """Validate WhatsApp Business API credentials"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.API_BASE}/{self.credentials['phone_number_id']}"
                headers = {"Authorization": f"Bearer {self.credentials['access_token']}"}
                async with session.get(url, headers=headers) as resp:
                    return resp.status == 200
        except:
            return False
    
    async def send_message(self, recipient: str, message: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Send WhatsApp message"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.API_BASE}/{self.credentials['phone_number_id']}/messages"
            
            # Format phone number
            phone = recipient.replace("+", "").replace("-", "").replace(" ", "")
            
            data = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {"body": message}
            }
            
            if media_urls:
                data["type"] = "image"
                data["image"] = {"link": media_urls[0]}
                del data["text"]
            
            headers = {
                "Authorization": f"Bearer {self.credentials['access_token']}",
                "Content-Type": "application/json"
            }
            
            async with session.post(url, json=data, headers=headers) as resp:
                result = await resp.json()
                return {
                    "success": resp.status == 200,
                    "message_id": result.get("messages", [{}])[0].get("id"),
                    "error": result.get("error", {}).get("message") if resp.status != 200 else None
                }
    
    async def get_profile_info(self, profile_id: str) -> Dict[str, Any]:
        """Get WhatsApp profile information"""
        # WhatsApp doesn't provide profile info via API
        return {"phone": profile_id}

# Twitter/X connector
class TwitterConnector(SocialMediaConnector):
    API_BASE = "https://api.twitter.com/2"
    
    async def validate_credentials(self) -> bool:
        """Validate Twitter API credentials"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.API_BASE}/users/me"
                headers = {"Authorization": f"Bearer {self.credentials['bearer_token']}"}
                async with session.get(url, headers=headers) as resp:
                    return resp.status == 200
        except:
            return False
    
    async def send_message(self, recipient: str, message: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Send Twitter Direct Message"""
        async with aiohttp.ClientSession() as session:
            # Get recipient user ID
            user_id = await self._get_user_id(session, recipient)
            if not user_id:
                return {"success": False, "error": "User not found"}
            
            # Create DM
            url = f"{self.API_BASE}/dm_conversations/with/{user_id}/messages"
            data = {"text": message}
            
            if media_urls:
                # Upload media first
                media_id = await self._upload_media(session, media_urls[0])
                if media_id:
                    data["attachments"] = [{"media_id": media_id}]
            
            headers = {
                "Authorization": f"Bearer {self.credentials['bearer_token']}",
                "Content-Type": "application/json"
            }
            
            async with session.post(url, json=data, headers=headers) as resp:
                if resp.status == 201:
                    result = await resp.json()
                    return {
                        "success": True,
                        "message_id": result["data"]["id"]
                    }
                else:
                    error = await resp.json()
                    return {
                        "success": False,
                        "error": error.get("detail", "Failed to send message")
                    }
    
    async def _get_user_id(self, session: aiohttp.ClientSession, username: str) -> Optional[str]:
        """Get Twitter user ID from username"""
        username = username.replace("@", "")
        url = f"{self.API_BASE}/users/by/username/{username}"
        headers = {"Authorization": f"Bearer {self.credentials['bearer_token']}"}
        
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data["data"]["id"]
        return None
    
    async def _upload_media(self, session: aiohttp.ClientSession, media_url: str) -> Optional[str]:
        """Upload media to Twitter"""
        # Download media
        async with session.get(media_url) as resp:
            if resp.status != 200:
                return None
            media_data = await resp.read()
        
        # Upload to Twitter
        upload_url = "https://upload.twitter.com/1.1/media/upload.json"
        headers = {"Authorization": f"Bearer {self.credentials['bearer_token']}"}
        data = aiohttp.FormData()
        data.add_field("media", media_data)
        
        async with session.post(upload_url, data=data, headers=headers) as resp:
            if resp.status == 200:
                result = await resp.json()
                return result["media_id_string"]
        return None
    
    async def get_profile_info(self, profile_id: str) -> Dict[str, Any]:
        """Get Twitter profile information"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.API_BASE}/users/{profile_id}"
            params = {
                "user.fields": "name,username,description,created_at,public_metrics,verified"
            }
            headers = {"Authorization": f"Bearer {self.credentials['bearer_token']}"}
            
            async with session.get(url, params=params, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["data"]
                return {}

# LinkedIn connector (requires OAuth2)
class LinkedInConnector(SocialMediaConnector):
    API_BASE = "https://api.linkedin.com/v2"
    
    async def validate_credentials(self) -> bool:
        """Validate LinkedIn API credentials"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.API_BASE}/me"
                headers = {"Authorization": f"Bearer {self.credentials['access_token']}"}
                async with session.get(url, headers=headers) as resp:
                    return resp.status == 200
        except:
            return False
    
    async def send_message(self, recipient: str, message: str, media_urls: List[str] = None) -> Dict[str, Any]:
        """Send LinkedIn message"""
        # LinkedIn messaging API is restricted
        # This would require LinkedIn Sales Navigator or Recruiter license
        return {
            "success": False,
            "error": "LinkedIn messaging requires Sales Navigator API access"
        }
    
    async def get_profile_info(self, profile_id: str) -> Dict[str, Any]:
        """Get LinkedIn profile information"""
        async with aiohttp.ClientSession() as session:
            url = f"{self.API_BASE}/people/{profile_id}"
            headers = {"Authorization": f"Bearer {self.credentials['access_token']}"}
            
            async with session.get(url, headers=headers) as resp:
                if resp.status == 200:
                    return await resp.json()
                return {}

# Main service class
class SocialMediaService:
    CONNECTORS = {
        "instagram": InstagramConnector,
        "whatsapp": WhatsAppConnector,
        "twitter": TwitterConnector,
        "linkedin": LinkedInConnector
    }
    
    def __init__(self):
        self._connectors: Dict[str, SocialMediaConnector] = {}
    
    async def validate_credentials(self, channel: str, credentials: Dict[str, Any]) -> bool:
        """Validate credentials for a social media channel"""
        connector_class = self.CONNECTORS.get(channel)
        if not connector_class:
            return False
        
        connector = connector_class(credentials)
        return await connector.validate_credentials()
    
    def get_connector(self, channel: str, credentials: Dict[str, Any]) -> Optional[SocialMediaConnector]:
        """Get or create a connector for a channel"""
        key = f"{channel}:{hashlib.md5(json.dumps(credentials, sort_keys=True).encode()).hexdigest()}"
        
        if key not in self._connectors:
            connector_class = self.CONNECTORS.get(channel)
            if connector_class:
                self._connectors[key] = connector_class(credentials)
        
        return self._connectors.get(key)
    
    async def send_message(
        self, 
        channel: str, 
        credentials: Dict[str, Any],
        recipient: str, 
        message: str, 
        media_urls: List[str] = None
    ) -> Dict[str, Any]:
        """Send a message through a social media channel"""
        connector = self.get_connector(channel, credentials)
        if not connector:
            return {"success": False, "error": f"Unsupported channel: {channel}"}
        
        try:
            return await connector.send_message(recipient, message, media_urls)
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def get_profile_info(
        self,
        channel: str,
        credentials: Dict[str, Any],
        profile_id: str
    ) -> Dict[str, Any]:
        """Get profile information from a social media channel"""
        connector = self.get_connector(channel, credentials)
        if not connector:
            return {}
        
        try:
            return await connector.get_profile_info(profile_id)
        except:
            return {}
    
    def get_required_credentials(self, channel: str) -> List[str]:
        """Get list of required credentials for a channel"""
        requirements = {
            "instagram": ["access_token", "page_id"],
            "whatsapp": ["access_token", "phone_number_id"],
            "twitter": ["bearer_token"],
            "linkedin": ["access_token"]
        }
        return requirements.get(channel, [])