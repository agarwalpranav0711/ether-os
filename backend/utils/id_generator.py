import uuid

def generate_id() -> str:
    """Generates a unique UUID string."""
    return str(uuid.uuid4())
