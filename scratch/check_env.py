import sys
import platform
import os
import psutil
import shutil

print("=== SYSTEM ENVIRONMENT AUDIT ===")
print(f"Python Version: {sys.version}")
print(f"Platform: {platform.platform()}")
print(f"Architecture: {platform.architecture()}")
print(f"CPU Count (Logical): {os.cpu_count()}")
print(f"Total RAM: {psutil.virtual_memory().total / (1024**3):.2f} GB")
print(f"Available RAM: {psutil.virtual_memory().available / (1024**3):.2f} GB")
print(f"Free Disk Space: {shutil.disk_usage('.').free / (1024**3):.2f} GB")

try:
    import torch
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device Count: {torch.cuda.device_count()}")
        print(f"Device Name: {torch.cuda.get_device_name(0)}")
        print(f"VRAM Total: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")
except ImportError:
    print("PyTorch: Not installed")
