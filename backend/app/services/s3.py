import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.config import settings


def get_s3_client():
    """Tạo S3 client (AWS S3)."""
    config = Config(
        signature_version="s3v4",
        region_name=settings.S3_REGION,
    )

    client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=config,
    )

    return client


def generate_presigned_upload_url(
    object_key: str,
    content_type: str,
    expires_in: int = 3600,  # 1 hour
) -> str:
    """
    Tạo presigned URL để upload file lên AWS S3.

    Args:
        object_key: Đường dẫn file trong bucket (ví dụ: "songs/123/audio.mp3")
        content_type: MIME type của file (ví dụ: "audio/mpeg")
        expires_in: Thời gian hết hạn (giây), mặc định 1 giờ

    Returns:
        Presigned URL để upload file
    """
    s3_client = get_s3_client()

    try:
        url = s3_client.generate_presigned_url(
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
        raise Exception(f"Failed to generate presigned URL: {str(e)}")


def get_public_url(object_key: str) -> str:
    """
    Lấy public URL của file sau khi upload lên AWS S3.

    Bucket cần được cấu hình public read hoặc dùng CloudFront nếu cần private.
    """
    return f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{object_key}"
