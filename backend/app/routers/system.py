from fastapi import APIRouter
import torch
import platform
import psutil
from typing import Dict, Any

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/capabilities")
async def get_system_capabilities() -> Dict[str, Any]:
    """Get system capabilities including GPU information"""
    
    # GPU Information
    gpu_info = {
        "cuda_available": torch.cuda.is_available(),
        "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "gpu_name": None,
        "gpu_memory": None,
        "cuda_version": None,
    }
    
    if torch.cuda.is_available():
        gpu_info.update({
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_memory": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB",
            "cuda_version": torch.version.cuda,
        })
    
    # System Information  
    system_info = {
        "cpu_count": psutil.cpu_count(),
        "ram_total": f"{psutil.virtual_memory().total / 1024**3:.1f} GB",
        "platform": platform.platform(),
        "python_version": platform.python_version()
    }
    
    # Model Information
    from app.config import EMBEDDING_MODEL, USE_GPU, ENVIRONMENT
    
    model_info = {
        "embedding_model": EMBEDDING_MODEL,
        "gpu_mode_enabled": USE_GPU,
        "environment": ENVIRONMENT,
    }
    
    return {
        "gpu": gpu_info,
        "system": system_info,
        "model": model_info
    }