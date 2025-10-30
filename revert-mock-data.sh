#!/bin/bash
# Script to revert all mock data changes in one go

echo "Reverting mock data changes..."

# Restore the real k8sService
cd src/services
cp k8sService.real.ts k8sService.ts

# Remove mock files
rm -f mockData.ts
rm -f k8sService.mock.ts
rm -f k8sService.real.ts

cd ../..

# Remove this script
rm -f revert-mock-data.sh

echo "✅ All mock data changes reverted successfully!"
echo "The app is now back to using the real Kubernetes API."
