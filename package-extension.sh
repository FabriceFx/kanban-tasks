#!/bin/bash
# package-extension.sh — Script de packaging automatisé pour Kanban Tasks (macOS)
# Ce script compile l'extension, lance les tests unitaires et génère une archive ZIP propre prête à être soumise sur le Chrome Web Store.

set -e

echo "=== 🚀 Démarrage du processus de packaging pour le Chrome Web Store ==="

# 1. Compilation de l'extension avec esbuild
echo "📦 Compilation des scripts avec esbuild..."
npm run build

# 2. Exécution des tests unitaires
echo "🧪 Lancement des tests unitaires avec Vitest..."
npm run test

# 3. Définition des variables
EXTENSION_NAME="kanban-tasks"
VERSION=$(node -p "require('./manifest.json').version")
OUTPUT="${EXTENSION_NAME}-v${VERSION}.zip"

# Nettoyage des anciennes archives
if [ -f "$OUTPUT" ]; then
  echo "🧹 Suppression de l'ancienne archive $OUTPUT..."
  rm -f "$OUTPUT"
fi

# 4. Création de l'archive ZIP propre
echo "🗜️  Création de l'archive ZIP propre..."
zip -r "$OUTPUT" . \
  -x ".git/*" \
  -x "node_modules/*" \
  -x ".env" \
  -x "*.map" \
  -x "parser.test.js" \
  -x "*.spec.*" \
  -x ".eslintrc*" \
  -x ".prettierrc*" \
  -x "package.json" \
  -x "package-lock.json" \
  -x "CHROMEWEBSTORE.md" \
  -x "readme.md" \
  -x "oauth_setup.md" \
  -x "travail restant à faire.md" \
  -x "CONTRIBUTING.md" \
  -x "LICENSE" \
  -x "package-extension.sh" \
  -x ".DS_Store" \
  -x "Thumbs.db"

echo ""
echo "================================================================="
echo "✅ ARCHIVE PRÊTE POUR LE CHROME WEB STORE !"
echo "Nom du fichier : $OUTPUT"
echo "Taille du fichier : $(du -h "$OUTPUT" | cut -f1)"
echo "================================================================="
echo "Vous pouvez maintenant charger ce fichier ZIP directement sur le"
echo "Chrome Developer Dashboard à l'adresse : https://chrome.google.com/webstore/devconsole"
echo "================================================================="
