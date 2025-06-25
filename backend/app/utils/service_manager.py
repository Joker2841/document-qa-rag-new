"""
Service Manager - Centralized service initialization and health monitoring
"""
import logging
import time
from typing import Dict, Any, Optional
from pathlib import Path
import torch

from app.services.rag_service import RAGService
from app.services.llm import LLMService

logger = logging.getLogger(__name__)


class ServiceManager:
    """Manages all RAG system services with health monitoring."""
    
    def __init__(self):
        """Initialize service manager."""
        self.rag_service: Optional[RAGService] = None
        self.llm_service: Optional[LLMService] = None
        self.initialization_time: Optional[float] = None
        self.services_healthy = False
        
    def initialize_services(self) -> Dict[str, Any]:
        """
        Initialize all services with proper error handling.
        
        Returns:
            Initialization status and details
        """
        start_time = time.time()
        logger.info("🚀 Starting service initialization...")
        
        initialization_status = {
            "success": False,
            "services_initialized": [],
            "services_failed": [],
            "gpu_info": self._get_gpu_info(),
            "initialization_time": 0.0,
            "errors": []
        }
        
        try:
            # Initialize RAG Service
            logger.info("📊 Initializing RAG Service...")
            rag_start = time.time()
            self.rag_service = RAGService()
            rag_time = time.time() - rag_start
            initialization_status["services_initialized"].append({
                "service": "RAG",
                "time": rag_time,
                "status": "✅ Ready"
            })
            logger.info(f"✅ RAG Service initialized in {rag_time:.2f}s")
            
        except Exception as e:
            error_msg = f"RAG Service initialization failed: {e}"
            logger.error(f"❌ {error_msg}")
            initialization_status["services_failed"].append("RAG")
            initialization_status["errors"].append(error_msg)
        
        try:
            # Initialize LLM Service
            logger.info("🧠 Initializing LLM Service...")
            llm_start = time.time()
            self.llm_service = LLMService()
            llm_time = time.time() - llm_start
            
            # Check LLM status
            llm_status = self.llm_service.get_service_status()
            primary_available = llm_status.get('primary_llm') is not None
            
            initialization_status["services_initialized"].append({
                "service": "LLM", 
                "time": llm_time,
                "status": "✅ Ready" if primary_available else "⚠️ Degraded",
                "details": llm_status
            })
            
            if primary_available:
                logger.info(f"✅ LLM Service initialized in {llm_time:.2f}s")
            else:
                logger.warning(f"⚠️ LLM Service initialized but no primary LLM available")
            
        except Exception as e:
            error_msg = f"LLM Service initialization failed: {e}"
            logger.error(f"❌ {error_msg}")
            initialization_status["services_failed"].append("LLM")
            initialization_status["errors"].append(error_msg)
        
        # Calculate total initialization time
        total_time = time.time() - start_time
        self.initialization_time = total_time
        initialization_status["initialization_time"] = total_time
        
        # Determine overall success
        services_count = len(initialization_status["services_initialized"])
        failed_count = len(initialization_status["services_failed"])
        
        if services_count > 0 and failed_count == 0:
            initialization_status["success"] = True
            self.services_healthy = True
            logger.info(f"🎉 All services initialized successfully in {total_time:.2f}s")
        elif services_count > 0:
            initialization_status["success"] = True  # Partial success
            self.services_healthy = False
            logger.warning(f"⚠️ Partial initialization: {services_count} success, {failed_count} failed")
        else:
            initialization_status["success"] = False
            self.services_healthy = False
            logger.error("❌ Service initialization failed completely")
        
        return initialization_status
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status of all services."""
        health_info = {
            "timestamp": time.time(),
            "services_healthy": self.services_healthy,
            "initialization_time": self.initialization_time,
            "gpu_info": self._get_gpu_info(),
            "services": {}
        }
        
        # RAG Service health
        if self.rag_service:
            try:
                rag_stats = self.rag_service.get_stats()
                health_info["services"]["rag"] = {
                    "status": "healthy",
                    "stats": rag_stats
                }
            except Exception as e:
                health_info["services"]["rag"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
        else:
            health_info["services"]["rag"] = {
                "status": "not_initialized"
            }
        
        # LLM Service health
        if self.llm_service:
            try:
                llm_status = self.llm_service.get_service_status()
                health_info["services"]["llm"] = {
                    "status": "healthy" if llm_status.get('primary_llm') else "degraded",
                    "details": llm_status
                }
            except Exception as e:
                health_info["services"]["llm"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
        else:
            health_info["services"]["llm"] = {
                "status": "not_initialized"
            }
        
        return health_info
    
    def _get_gpu_info(self) -> Dict[str, Any]:
        """Get GPU information."""
        gpu_info = {
            "available": torch.cuda.is_available(),
            "device_count": 0,
            "devices": []
        }
        
        if torch.cuda.is_available():
            gpu_info["device_count"] = torch.cuda.device_count()
            
            for i in range(torch.cuda.device_count()):
                device_props = torch.cuda.get_device_properties(i)
                gpu_info["devices"].append({
                    "id": i,
                    "name": torch.cuda.get_device_name(i),
                    "memory_gb": round(device_props.total_memory / 1024**3, 1),
                    "compute_capability": f"{device_props.major}.{device_props.minor}"
                })
        
        return gpu_info
    
    def restart_service(self, service_name: str) -> Dict[str, Any]:
        """Restart a specific service."""
        logger.info(f"🔄 Restarting {service_name} service...")
        
        try:
            if service_name.lower() == "rag":
                self.rag_service = RAGService()
                return {"success": True, "message": f"{service_name} service restarted"}
            elif service_name.lower() == "llm":
                self.llm_service = LLMService()
                return {"success": True, "message": f"{service_name} service restarted"}
            else:
                return {"success": False, "error": f"Unknown service: {service_name}"}
                
        except Exception as e:
            error_msg = f"Failed to restart {service_name} service: {e}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}


# Global service manager instance
service_manager = ServiceManager()