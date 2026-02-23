"""
S3 integration for Muzicc backend.
Uses IRSA on EKS (no access keys). Bucket: songs/ prefix.
"""
import logging
import re
import time
import uuid
from typing import Any, Optional
from urllib.parse import quote

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

S3_PREFIX = "songs/"
ALLOWED_EXTENSIONS = {"mp3"}
ALLOWED_CONTENT_TYPES = {"audio/mpeg"}
DEFAULT_EXT = "mp3"
PRESIGNED_EXPIRES = 3600  # 1 hour


def get_s3_client() -> Any:
    """
    Create S3 client. Uses IAM Role (IRSA) on EKS; no credentials passed.
    Production: retries + standard mode.
    """
    config = Config(
        signature_version="s3v4",
        region_name=settings.S3_REGION,
        retries={"max_attempts": 3, "mode": "standard"},
    )
    client = boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        config=config,
    )
    logger.debug("S3 client created for region=%s", settings.S3_REGION)
    return client


def _sanitize_extension(filename: str) -> str:
    """Extract and sanitize extension; only allow mp3."""
    if "." in filename:
        raw = filename.rsplit(".", 1)[-1].strip().lower()
    else:
        raw = DEFAULT_EXT
    ext = re.sub(r"[^a-z0-9]", "", raw) or DEFAULT_EXT
    if ext not in ALLOWED_EXTENSIONS:
        ext = DEFAULT_EXT
    return ext


def build_s3_key(filename: str) -> str:
    """
    Build a safe S3 object key: songs/{uuid}.{ext}.
    Only .mp3 extension allowed.
    """
    ext = _sanitize_extension(filename)
    unique = uuid.uuid4().hex[:8]
    key = f"{S3_PREFIX}{unique}.{ext}"
    logger.debug("Built S3 key: %s from filename=%s", key, filename)
    return key


def generate_presigned_upload_url(
    object_key: str,
    content_type: str,
    expires_in: int = PRESIGNED_EXPIRES,
) -> str:
    """
    Generate presigned URL for put_object. Includes ContentType. Expires in 1 hour.
    """
    logger.info(
        "Generating presigned upload URL: bucket=%s key=%s content_type=%s",
        settings.S3_BUCKET,
        object_key,
        content_type,
    )
    client = get_s3_client()
    try:
        url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "Unknown")
        msg = e.response.get("Error", {}).get("Message", str(e))
        logger.exception(
            "Failed to generate presigned URL: bucket=%s key=%s code=%s",
            settings.S3_BUCKET,
            object_key,
            code,
        )
        raise ValueError(f"Failed to generate presigned URL: {code} - {msg}") from e


def generate_presigned_get_url(
    object_key: str,
    expires_in: int = PRESIGNED_EXPIRES,
) -> str:
    """Generate presigned URL for get_object (private bucket)."""
    logger.info(
        "Generating presigned GET URL: bucket=%s key=%s",
        settings.S3_BUCKET,
        object_key,
    )
    client = get_s3_client()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": object_key,
            },
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "Unknown")
        msg = e.response.get("Error", {}).get("Message", str(e))
        logger.exception(
            "Failed to generate presigned GET URL: bucket=%s key=%s code=%s",
            settings.S3_BUCKET,
            object_key,
            code,
        )
        raise ValueError(f"Failed to generate presigned GET URL: {code} - {msg}") from e


def get_public_url(object_key: str) -> str:
    """
    Direct public URL (only valid if bucket is public).
    Object key is URL-encoded (path-safe).
    """
    encoded_key = quote(object_key, safe="/")
    base = (
        f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com"
    )
    return f"{base}/{encoded_key}"


def get_file_url(object_key: str) -> str:
    """
    URL to access the file. If S3_PUBLIC=True returns direct URL;
    otherwise returns presigned GET URL (for private bucket / CloudFront later).
    """
    if getattr(settings, "S3_PUBLIC", False):
        return get_public_url(object_key)
    return generate_presigned_get_url(object_key)


def object_exists(
    object_key: str,
    max_attempts: int = 3,
    delay_seconds: float = 0.2,
) -> bool:
    """
    Verify that the object exists in S3 (head_object) with small retries.
    Returns False when object truly does not exist.
    Raises RuntimeError for infra / permission errors.
    """
    client = get_s3_client()
    for attempt in range(max_attempts):
        try:
            client.head_object(Bucket=settings.S3_BUCKET, Key=object_key)
            return True
        except ClientError as e:
            code = e.response.get("Error", {}).get("Code", "Unknown")
            if code in ("404", "NoSuchKey"):
                # Retry only on NoSuchKey to hide rare S3 latency after PUT.
                if code == "NoSuchKey" and attempt < max_attempts - 1:
                    time.sleep(delay_seconds)
                    continue
                return False
            logger.warning(
                "S3 head_object failed: bucket=%s key=%s code=%s",
                settings.S3_BUCKET,
                object_key,
                code,
                extra={"key": object_key, "error_code": code},
            )
            raise RuntimeError(f"S3 check failed: {code}") from e


def list_songs(prefix: str = S3_PREFIX, max_keys: int = 1000) -> list[str]:
    """
    List object keys under prefix (default: songs/). Only .mp3 keys.
    """
    client = get_s3_client()
    keys: list[str] = []
    continuation_token: Optional[str] = None
    try:
        while True:
            kwargs: dict[str, Any] = {
                "Bucket": settings.S3_BUCKET,
                "Prefix": prefix,
                "MaxKeys": min(max_keys - len(keys), 1000),
            }
            if continuation_token:
                kwargs["ContinuationToken"] = continuation_token
            resp = client.list_objects_v2(**kwargs)
            request_id = resp.get("ResponseMetadata", {}).get("RequestId")
            if request_id:
                logger.info("S3 request_id=%s", request_id)
            contents = resp.get("Contents")
            if contents is None:
                contents = []
            for obj in contents:
                key = obj.get("Key")
                if key and key.endswith(".mp3"):
                    keys.append(key)
                    if len(keys) >= max_keys:
                        break
            if not resp.get("IsTruncated") or len(keys) >= max_keys:
                break
            continuation_token = resp.get("NextContinuationToken")
        logger.info(
            "Listed %d objects under prefix=%s bucket=%s",
            len(keys),
            prefix,
            settings.S3_BUCKET,
        )
        return keys
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "Unknown")
        logger.exception(
            "Failed to list S3 objects: bucket=%s prefix=%s code=%s",
            settings.S3_BUCKET,
            prefix,
            code,
        )
        raise ValueError(f"Failed to list objects: {code}") from e
