#!/bin/bash

cd antlr/

# Set variables
ANTLR_JAR="antlr-4.13.2-complete.jar"
ANTLR_URL="https://www.antlr.org/download/$ANTLR_JAR"

# Download ANTLR jar if it doesn't exist
if [ ! -f "$ANTLR_JAR" ]; then
  echo "Downloading $ANTLR_JAR..."
  curl -o "$ANTLR_JAR" "$ANTLR_URL" || { echo "Download failed"; exit 1; }
else
  echo "$ANTLR_JAR already exists."
fi

cd ../src/filtering

# Run ANTLR
echo "Running ANTLR..."
java -jar "../../antlr/$ANTLR_JAR" -visitor -o ./generated -Dlanguage=TypeScript SemanticFiltering.g4

