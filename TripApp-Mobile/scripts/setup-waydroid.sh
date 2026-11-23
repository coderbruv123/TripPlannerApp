#!/usr/bin/env bash
set -euo pipefail

# Lightweight Android container for testing TripApp-Mobile on Arch/Wayland.
# Requires sudo. Review before running.

if ! command -v pacman >/dev/null 2>&1; then
  echo "This script targets Arch Linux (pacman)."; exit 1
fi

echo "==> Installing waydroid..."
sudo pacman -S --needed waydroid lzip

echo "==> Enabling/starting waydroid container service..."
sudo systemctl enable --now waydroid-container

echo "==> Initializing Waydroid (downloads Android image)..."
# Use GAPPS variant if you want Play Store/Expo Go easily:
# sudo waydroid init -s GAPPS -f
sudo waydroid init

echo "==> Start session (run in your Wayland desktop session):"
echo "    waydroid session start"
echo "==> Launch UI:"
echo "    waydroid show-full-ui"
echo ""
echo "For Expo Go, prefer GAPPS image init or sideload Expo Go APK."
echo "For dev builds: waydroid app install <apk>"
