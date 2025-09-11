#!/bin/bash

# Script deploy Ziji Discord Bot lên Google Cloud
echo "===== Deploy Ziji Discord Bot lên Google Cloud ====="

# Kiểm tra tham số đầu vào
if [ $# -eq 0 ]; then
    echo "Vui lòng cung cấp địa chỉ IP của Google Cloud VM"
    echo "Cách sử dụng: ./deploy_to_cloud.sh <VM_IP_ADDRESS> [SSH_KEY_PATH]"
    exit 1
fi

VM_IP=$1
SCRIPT_NAME="setup_bot.sh"
SSH_KEY=${2:-"google_cloud_key"}

echo "Địa chỉ VM: $VM_IP"
echo "Script cài đặt: $SCRIPT_NAME"

# Upload script lên VM
echo "Upload script cài đặt lên VM..."
scp -i $SSH_KEY $SCRIPT_NAME xinloi@$VM_IP:~/

# Kết nối SSH và chạy script cài đặt
echo "Kết nối SSH và cài đặt bot..."
ssh -i $SSH_KEY xinloi@$VM_IP "chmod +x ~/$SCRIPT_NAME && ~/$SCRIPT_NAME"

echo "===== Hoàn tất deploy ====="
echo "Bot đã được cài đặt và chạy trên Google Cloud VM: $VM_IP"
echo ""
echo "Để kiểm tra trạng thái bot:"
echo "ssh -i $SSH_KEY xinloi@$VM_IP 'pm2 status'"
echo ""
echo "Để xem logs của bot:"
echo "ssh -i $SSH_KEY xinloi@$VM_IP 'pm2 logs ziji-bot'"
