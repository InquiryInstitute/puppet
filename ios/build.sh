#!/bin/bash
# Build script for MarionetteController iOS app

set -e

PROJECT_NAME="MarionetteController"
SCHEME="MarionetteController"
CONFIGURATION="${1:-Release}"

echo "Building $PROJECT_NAME ($CONFIGURATION)..."

# Check if project exists
if [ ! -f "$PROJECT_NAME.xcodeproj/project.pbxproj" ]; then
    echo "Error: Xcode project not found. Run ./setup.sh first."
    exit 1
fi

# Build for iOS device
echo "Building for iOS device..."
xcodebuild \
    -project "$PROJECT_NAME.xcodeproj" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -sdk iphoneos \
    -archivePath "build/$PROJECT_NAME.xcarchive" \
    archive \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

echo "✅ Build complete!"
echo "Archive location: build/$PROJECT_NAME.xcarchive"
